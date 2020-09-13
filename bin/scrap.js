const request = require('request')
const cheerio = require('cheerio')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path')
const { getLangCode } = require('./functions')

function loadLang(language) {
    return new Promise ((resolve, reject) => {
        request(`https://1000mostcommonwords.com/1000-most-common-${language}-words/`, (err, res, html) => {
            if(err) {
                reject(err)
            }
        
            let list = []
            
            const $ = cheerio.load(html)
            
            $('table').find('tbody > tr > td').each(function (index, element) {
                if (index % 3 != 0) {
                    list.push($(element).text());
                }
            });

            let code = getLangCode(language)

            const csvWriter = createCsvWriter({
                path: path.join(__dirname, `../languages/${code}-en.csv`),
                header: [
                    { id: 'lang1', title: language.replace(/^\w/, c => c.toUpperCase()) },
                    { id: 'lang2', title: 'English' },
                    { id: 'hint', title: 'Hint' }
                ]
            });

            const records = [];
            let val;

            list.forEach((item, index) => {
                if (index == 0 || index == 1) {
                    return
                }
                if (index % 2 == 0) {
                    val = item
                } else {
                    records.push({ lang1: val, lang2: item, hint: '' })
                }
            })

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