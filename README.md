# Fraud Seeker AdCrawler

## Project Description
The Fraud Seeker AdCrawler manages the extraction of search engine results for specific text snippets/phrases and thus helps us with the automated detection of fraudulent ads. By continuously monitoring search engines for phrases used by fraudulent websites, we can detect such fraudulent clusters as soon as they go online. The goal is to protect consumers from scams in search engines as soon as they are online.

Fraud Seeker was developed by [ÖIAT (Austrian Institute for Applied Telecommunication)](https://oiat.at/) together with [XYLEM Technologies](https://www.xylem-technologies.com/) and realized with funds provided by [netidee](https://www.netidee.at/).  

## Requirements
-	Node.js
-	keys.json generated from Google Sheet API [(activate via Google Cloud Console)](https://console.cloud.google.com)

## Getting started
Clone this project and fill out the Config.php with your database and API credentials. 

The source and destination tables can be generated with the sqls.sql script in a mysql-Database. 

WI_KEYWORDS: Needs to be populated with appropriate snippets to search for. 

WI_KEYWORDS: Table for keywords/phrases/snippets used to monitor/crawl the search engines. 

TABLE_WI_SEARCH_ENGINE_RESULT: Table with search engine results for the given phrases. 

TABLE_WI_FINDINGS: Table with new domain findings.

## Usage
Run the tool and crawl the search engine:
```
php PhraseFinder.php crawl <number of phrases> <number of result pages> <search engine>
```
     
This call crawls the results with the provided phrases monitoring a range of result pages. Google is used as the standard search engine. The use with other search engines could be implemented.    

```
php PhraseFinder.php store <start date (YYYY-MM-DD)> <end date (YYYY-MM-DD)> <search engine>
```
This call analyzes the results of the crawl with a certain date range and stores new domains in WI_FINDINGS.

## Extensions
Later modules can classify (automatic classification with mal2 classifier) or visualize the results for expert classification setting the type of the result. The abstract class WiSearchEngine.class can have additional subclasses to monitor/crawl other sources with the given phrases/snippets.

## Example call
```
php PhraseFinder.php crawl 5 2 google
```
Crawls google results with five keywords and up to 20 results.
This can be performed multiple times as a random selection from the available keywords/snippets is used.

After some calls the data can be aggregated in the findings table.
```
php PhraseFinder.php store 2023-09-01 2023-09-02 google 
```
Results are then available in the WiFindings Table for classification by further modules or expert classification and storing the result in the “type” variable.

## Licence
This software is available under the EUPL 1.2 open source license:
https://joinup.ec.europa.eu/collection/eupl/solution/eupl-freeopen-source-software-licence-european-union/releases
