# Fraud Seeker AdCrawler

## Project Description
The Fraud Seeker AdCrawler searches the meta ad library for specific text phrases and thus helps us with the automated detection of fraudulent ads on Facebook or Instagram. The continuous monitoring of the meta ad library allows us to detect scammers early and rapidly warn consumers of fraudulent ads.

The Fraud Seeker AdCrawler was developed by [ÖIAT (Austrian Institute for Applied Telecommunication)](https://oiat.at/) and realized with funds provided by [netidee](https://www.netidee.at/).  

## Requirements
-	node.js
-	keys.json generated from Google Sheet API [(activate via Google Cloud Console)](https://console.cloud.google.com)

## Installation 

-	Clone this project
-	Install the following packages 
```
npm install puppeteer
```
```
npm install googleapis express
```
```
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
```
-	Create keys.json: Activate the Google Sheet API via the Google Cloud Console, create a service account and then a JSON key for this account (rename to keys.json if necessary) and place the file in the Meta AdCrawler directory.
-	Specify the proxy URL, user, password and Google Sheets ID in ads-library_git.js.
-	Start Meta AdCrawler with ```node .\ads-library_git.js```

## How it works

The Meta AdCrawler accesses a Google Spreadsheet via the Google API and extracts the search terms from the "Search Terms" spreadsheet. A Google Chrome instance is then started with the Puppeteer Library, navigated to the Meta Ad Library and triggers the search process. After receiving the search result, the system navigates to the bottom of the page and extracts information from the individual advertising providers (name, account verification status, number of followers, account creation date, account URL, number of ads for the given search term). The extracted information is displayed in the specified Google spreadsheet in the "Results" worksheet and can be analysed there.
