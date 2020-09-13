const fs = require('fs');
const locale = require('locale-codes')
const csv = require('csv-parser');

function readCsv(path) {
    return new Promise((resolve, reject) => {
        let word_list = []
        try {
            fs.createReadStream(path)
                .pipe(csv({ separator: ';' }))
                .on('data', async (row) => {
                    await word_list.push(row)
                })
                .on('end', () => {
                    resolve(word_list);
                });
        } catch (e) {
            console.log(e)
            reject(e)
        }
    })
}

function listDir(path) {
    return new Promise((resolve, reject) => {

        let languages = [];
        try {
            const files = fs.readdirSync(path);
    
            files.forEach(file => {
                languages.push(file.replace('.csv', ''))
            });
    
        } catch (err) {
            reject(err)
        }
    
        resolve(languages)
    })
}

function getLangCode(language) {
    let code = locale.getByName(language)
    return code.tag
}

function isInJson(value, json) {
    let hasMatch = false;

    for (let i = 0; i < json.length; ++i) {

        if (json[i][Object.keys(json[i])[0]] == value) {
            hasMatch = true;
            break;
        }
    }

    return hasMatch
}

module.exports = {
    readCsv,
    listDir,
    getLangCode,
    isInJson
}