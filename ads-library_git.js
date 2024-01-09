// npm install puppeteer
// npm install googleapis express
// npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth

const puppeteer = require('puppeteer-extra')
// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const express = require("express");
const { google } = require("googleapis");

const proxy = 'PROXYURL';
const proxyUser = 'USER';
const proxyPwd = 'PWD';
const googleSpreadSheetId = 'GOOGLESPREADSHEETID';

(async () => {

    // Read search terms from spreadsheet
    const { sheets } = await authSheets();
    const getSearchTerms = await sheets.spreadsheets.values.get({
        spreadsheetId: googleSpreadSheetId,
        range: "'Search terms'!A:A",
    });

    const searchterms = getSearchTerms.data.values;

    for (let i = 0; i < searchterms.length; i++) {
        let searchterm = searchterms[i][0].replace(' ', '%20');
        const browser = await puppeteer.launch({headless: false, args: [`--proxy-server=${proxy}`, '--start-maximized'], protocolTimeout: 240000,});
        
        const page = await browser.newPage();
        // Do not load images, stylesheets, and fonts
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (['image', 'font'].indexOf(request.resourceType()) !== -1) {
                request.abort();
            } else {
                request.continue();
            }
        });
        await page.authenticate({ 
            username: proxyUser , 
            password: proxyPwd 
        });

        console.log('https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=AT&q=' + searchterm + '&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped&search_type=keyword_unordered&media_type=all');
        const [response] = await Promise.all([
            page.waitForResponse(response => response.url().includes('/api/graphql/') && response.text().then(text => text.includes('dynamic_filter_options'))),
            await page.goto('https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=AT&q=' + searchterm + '&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped&search_type=keyword_unordered&media_type=all'),
            await page.waitForTimeout(3000),
            await page.mouse.move(100, 100),
            await page.mouse.down(),
            await page.mouse.up(),            
          ]).catch(e => console.log(e));

        if (await page.$('button[data-cookiebanner]:first-child') !== null)
          await page.click('button[data-cookiebanner]:first-child', { delay: 500 });
        await autoScroll(page), // Scroll page down to get all ads

        links = await page.$$eval('a[target="_blank"][href^="https://facebook.com/"]', images => images.map(i => (i.textContent))); // Extract links to count ads

        const responseText = await response.text();
        console.log(responseText);
        const profileJSON = JSON.parse(responseText); // Parse ad profiles

        const pages = profileJSON.data.ad_library_main.dynamic_filter_options.pages;

        for(var advertiser of pages) {
            console.log(advertiser);
            await page.waitForTimeout(2000 + Math.floor(Math.random() * 1000));
            let outputLine = [];
            const outputSearchTerm = searchterms[i][0];
            const outputAccountName = advertiser.display_name;
            const outputCrawlingDate = new Date();

            pageProfile = await browser.newPage();
            await page.authenticate({ 
                username: proxyUser , 
                password: proxyPwd 
            });

            const outputAccountAdLibraryURL = 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=AT&view_all_page_id=' + advertiser.key + '&search_type=page&media_type=all';
            console.log(outputAccountAdLibraryURL);
            try {
                const [detailResponse] = await Promise.all([
                    await pageProfile.goto(outputAccountAdLibraryURL, {waitUntil: 'networkidle0'})
                ]);

                const detailResponseText = await detailResponse.text();

                resultsSelector = await pageProfile.waitForSelector('text/result');
                results = await resultsSelector?.evaluate(el => el.textContent);
                const outputAdsTotal = parseInt(results.split(' ')[0].slice(1));
                
                // Extract account verification status
                startString = "page_verification:\"";
                endString = "\",";
                match = detailResponseText.match(new RegExp(`${startString}(.*?)${endString}`));
                const outputVerificationStatus = match ? match[1] : "N/A";
    
                // Extract number of followers
                startString = "likes:";
                endString = ",";
                match = detailResponseText.match(new RegExp(`${startString}(.*?)${endString}`));
                const outputFollowers = match ? parseInt(match[1].replace('.', '')) : "N/A";
    
                // Extract account creation date
                startString = "history_items:\\[\\{event_time:";
                endString = ",";
                match = detailResponseText.match(new RegExp(`${startString}(.*?)${endString}`));
                const outputCreationDate = (match ? (() => {
                    date = new Date(match[1] * 1000);
                    outputCreationDateFormatted = date.toLocaleDateString("de-DE");
                    return outputCreationDateFormatted;
                  })() : "N/A");
    
                // Extract account URL
                startString = "page_profile_uri:\"";
                endString = "\",";
                match = detailResponseText.match(new RegExp(`${startString}(.*?)${endString}`));
                const outputAccountURL = match ? match[1] : "N/A";
    
                // Extract number of ads for the given search term
                const outputAdsForSearchTerm = countOccurrences(links, outputAccountName);
    
                // Add extracted data to output
                await sheets.spreadsheets.values.append({
                    spreadsheetId: googleSpreadSheetId,
                    range: "Results",
                    valueInputOption: "USER_ENTERED",
                    resource: {
                      values: [[outputCrawlingDate, outputSearchTerm, outputAccountName, outputAdsForSearchTerm, outputAdsTotal, outputVerificationStatus, outputFollowers, outputCreationDate, outputAccountURL, outputAccountAdLibraryURL]],
                    },
                  });
                  

            } catch (err) {
                console.error(err.message);
                await sheets.spreadsheets.values.append({
                    spreadsheetId: googleSpreadSheetId,
                    range: "Results",
                    valueInputOption: "USER_ENTERED",
                    resource: {
                      values: [[outputCrawlingDate, outputSearchTerm, outputAccountName, "N/A", "N/A", "N/A", "N/A", "N/A", "N/A", outputAccountAdLibraryURL]],
                    },
                  });
            }
 
            await pageProfile.close();
        }

        await browser.close();
    }

})();

function countOccurrences(array, searchString) {
    return array.reduce((count, str) => {
      if (str === searchString) {
        return count + 1;
      }
      return count;
    }, 0);
  }
  

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 400);
        });
    });
}

async function authSheets() {
    //Function for authentication object
    const auth = new google.auth.GoogleAuth({
      keyFile: "keys.json",
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  
    //Create client instance for auth
    const authClient = await auth.getClient();
  
    //Instance of the Sheets API
    const sheets = google.sheets({ version: "v4", auth: authClient });
  
    return {
      auth,
      authClient,
      sheets,
    };
  }
  