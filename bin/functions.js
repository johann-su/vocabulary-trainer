const fs = require('fs');
const locale = require('locale-codes')
const csv = require('csv-parser');

// a function to read a csv in a given path
// Input: path to csv
// Output: Promise - parsed csv file
function readCsv(path) {
    return new Promise((resolve, reject) => {
        // empty list for values
        let word_list = []
        try {
            // start read strem
            fs.createReadStream(path)
                // pass the stream to csv module - set seperator of csv here
                .pipe(csv({ separator: ',' }))
                .on('data', async(row) => {
                    // push each row into list
                    await word_list.push(row)
                })
                .on('end', () => {
                    // return list with all rows
                    resolve(word_list);
                });
        } catch (e) {
            console.log(e)
            reject(e)
        }
    })
}


// a function to list all files in a given directory
// Input: path to directory
// Output: Promise - Array with filenames in directory
function listDir(path) {
    return new Promise((resolve, reject) => {
        // empty array for file names
        let languages = [];
        try {
            // read directory
            const files = fs.readdirSync(path);

            // remove csv and push filename in array
            files.forEach(file => {
                languages.push(file.replace('.csv', ''))
            });

        } catch (err) {
            reject(err)
        }

        // return all filenames
        resolve(languages)
    })
}

// a function to get the language code for a given language
// Input: language
// Output: language code
function getLangCode(language) {
    let code = locale.getByName(language)
    return code.tag
}

// a function to check if a given value is in a given json object
// Inputs: value, json object
// Outputs: Boolean
function isInJson(value, json) {
    let hasMatch = false;

    // loop through json until match is found and set hasMatch to true
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