const request = require('request')
const cheerio = require('cheerio')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path')
const { getLangCode } = require('./functions')

// a function to scrape a website (1000mostcommonwords.com) and get the 1000 most common words in that language
// Input: language
function loadLang(language) {
    return new Promise ((resolve, reject) => {
        // load html of website with according language
        request(`https://1000mostcommonwords.com/1000-most-common-${language}-words/`, (err, res, html) => {
            if(err) {
                reject(err)
            }
            
            // list for vocabulary from website
            let list = []
            
            const $ = cheerio.load(html)
            
            // iterate over results for table data (td) and push every second and third value to list (skipping rank how often word appears)
            $('table').find('tbody > tr > td').each(function (index, element) {
                if (index % 3 != 0) {
                    list.push($(element).text());
                }
            });
            
            // get the language code for new language - for more info on getLangCode() see functions.js
            let code = getLangCode(language)

            // initialize csv writer and pass table header
            const csvWriter = createCsvWriter({
                path: path.join(__dirname, `../languages/${code}-en.csv`),
                header: [
                    { id: 'lang1', title: language.replace(/^\w/, c => c.toUpperCase()) },
                    { id: 'lang2', title: 'English' },
                    { id: 'hint', title: 'Hint' }
                ]
            });

            // a empty array for constructed csv data
            const records = [];
            // a cache for every other word in list array
            let val;

            // iterate over each word in list and construct csv rows by saving every odd word (new language) to cache and construction and object with every even word (known language) and odd word from cache
            list.forEach((item, index) => {
                // ommiting language headers
                if (index == 0 || index == 1) {
                    return
                }
                if (index % 2 == 0) {
                    val = item
                } else {
                    records.push({ lang1: val, lang2: item, hint: '' })
                }
            })

            // write file to path specified during initialisation
            csvWriter.writeRecords(records)
                .then(() => {
                    resolve()
                })
                .catch(e => reject(e))
        })
    })
}

module.exports = {
    loadLang
}