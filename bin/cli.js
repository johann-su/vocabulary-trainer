#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const util = require('util')
const inquirer = require('inquirer');
const textToSpeech = require('@google-cloud/text-to-speech');
const player = require('play-sound')(opts = {})
const { readCsv, listDir, getLangCode, isInJson } = require('./functions');
const { loadLang } = require('./scrap');

// the main function that gets called when opening the cli
(async() => {

    // define global variables
    let answers;
    let data;
    let word;
    let translation;
    let languages;
    let available;

    // look in language dir to see if any languages are available - more information about listDir() in functions.js
    await listDir(path.join(__dirname, `../languages/`))
        .then((data) => {
            available = data.length
        })
        .catch(e => console.log(e))
    
    // if no languages are available go directly to the add new language input
    if (available == 0) {
        // promt the user to enter a language
        await inquirer.prompt([{
                name: 'lang',
                type: 'input',
                message: 'Which language do you want to add?'
            }])
            .then((async answer => {
                // scrape this website (https://1000mostcommonwords.com) and extract the 1000 most common words in this language - for more info about loadLang() see scrap.js
                await loadLang(answer.lang)
                    .then(async() => {
                        console.log(`${answer.lang} was added to your languages 🥳`)
                        // load all languages form the languages directory to display in the next question (which language do you want to learn) - for more info on listDir() see functions.js
                        await listDir(path.join(__dirname, `../languages/`))
                            .then((data) => {
                                languages = data
                            })
                            .catch(e => console.log(e))
                    })
                    .catch(e => console.log(e))
            }))
            .catch(e => console.log(e))
    } else {
        // ask if the user wants to add a new language (has already at leat one)
        await inquirer.prompt([{
                name: 'new',
                type: 'confirm',
                message: 'Do you want to load a new language?',
                default: false
            }])
            .then((async answer => {
                // user wants to add a new language
                if (answer.new) {
                    // ask which language the user wants to add
                    await inquirer.prompt([{
                            name: 'lang',
                            type: 'input',
                            message: 'Which language do you want to add?'
                        }])
                        .then((async answer => {
                            // scrape this website (https://1000mostcommonwords.com) and extract the 1000 most common words in this language - for more info about loadLang() see scrap.js
                            await loadLang(answer.lang)
                                .then(async() => {
                                    console.log(`${answer.lang} was added to your languages 🥳`)
                                    // load all languages form the languages directory to display in the next question (which language do you want to learn) - for more info about listDir() see functions.js
                                    await listDir(path.join(__dirname, `../languages/`))
                                        .then((data) => {
                                            languages = data
                                        })
                                        .catch(e => console.log(e))
                                })
                                .catch(e => console.log(e))
                        }))
                        .catch(e => console.log(e))
                } else {
                    // load all languages form the languages directory to display in the next question (which language do you want to learn) - for more info on listDir() see functions.js
                    await listDir(path.join(__dirname, `../languages/`))
                        .then((data) => {
                            languages = data
                        })
                        .catch(e => console.log(e))
                }
            }))
    }

    // ask questions on how to learn vocabulary
    // 1. Q: Which Language?
    // 2. Q: With spoken words, new language to known language, known language to new language
    // 3. Q: Look at new Vocabulary, Learn new vocabulary, Learn known vocabulary
    await inquirer.prompt([
        {
            name: 'language',
            type: 'list',
            message: 'Which language du you want to learn?',
            choices: languages
        },
        {
            name: 'method',
            type: 'list',
            message: 'Select a method how you want to learn',
            choices: ['Speech', 'New language', 'Known language']
        },
        {
            name: 'practice',
            type: 'list',
            message: 'Select if you want to learn new words or practice',
            choices: ['New words', 'Practice', 'Known words']
        }
    ])
        .then(a => {
            // make answers available
            answers = a
        })
        .catch(e => console.log(e))
    
    // the user wants to learn new vocabulary with spoken words (new words -> known words)
    if (answers.method == 'Speech') {

        // load either vocabulary from the csv for new words or from memory for known words (json)
        if (answers.practice == 'Practice' || 'New words') {
            // for more info on readCsv() see functions.js
            data = await readCsv(path.join(__dirname, `../languages/${answers.language}.csv`))
        } else if (answers.practice == 'Known words') {
            data = JSON.parse(path.join(__dirname, '../storage/known_vocabulary.json'))
        }

        // iterare over the vocabulary from csv or json
        for (let i = 0; i < data.length; i++) {

            // the word from the language the user is learning
            word = data[i][Object.keys(data[i])[0]]
            // the translation of that word to a language the user knows
            translation = data[i][Object.keys(data[i])[1]]

            // check if a mp3 file of that word exists
            if (fs.existsSync(path.join(__dirname, `../audio/${word}.mp3`))) {
                // play the mp3 file for the current word
                player.play(path.join(__dirname, `../audio/${word}.mp3`), function(err) {
                    if (err) throw err
                })
            } else {
                // get the language code for the new language - more information about function in functions.js
                let code = getLangCode(Object.keys(data[i])[0].split(',')[0])

                // initialize googles text-to-speech api
                const client = new textToSpeech.TextToSpeechClient();

                // construct a request to the text to speech api
                const request = {
                    input: { text: word },
                    voice: { languageCode: code, ssmlGender: 'MALE' },
                    audioConfig: { audioEncoding: 'MP3' },
                };

                // send the request to the text-to-speech api
                const [response] = await client.synthesizeSpeech(request);
                // Write the binary audio content to a local file
                dir = './audio'
                // check if directory exsists - if not create it
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, {
                        recursive: true
                    });
                }
                const writeFile = util.promisify(fs.writeFile);
                // write file to the audio directory with the name of the vocabulary the user is learning
                await writeFile(path.join(__dirname, `../audio/${word}.mp3`), response.audioContent, 'binary').catch((err) => {
                    console.log("folder 'audio' not created")
                });
                // play the mp3 file for the current word
                player.play(path.join(__dirname, `../audio/${word}.mp3`), function(err) {
                    if (err) throw err
                })
            }

            // ask question about the current word 
            // the user wants to practice new or known words
            if (answers.practice == 'Practice' || answers.practice == 'Known words') {
                // the promt to enter the translation of the current word
                await inquirer.prompt([{
                        name: word,
                        type: 'input',
                        message: `What does "${word}" mean in ${Object.keys(data[i])[1]}`
                    }])
                    .then(answer => {
                        // check if the entered word matches the translation - upper lower case dosen't matter
                        if (answer[word].toLowerCase() == translation.toLowerCase()) {
                            console.log('correct 🔥')

                            // read the json file with known vocabulary
                            let known_vocabulary = fs.readFileSync(path.join(__dirname, '../storage/known_vocabulary.json'));
                            known_vocabulary = JSON.parse(known_vocabulary);

                            // check if word already is in json - for more info about isInJson() see functions.js
                            if (!isInJson(word, known_vocabulary)) {
                                // add word to known vocabulary
                                known_vocabulary.push(data[i])
                                known_vocabulary = JSON.stringify(known_vocabulary)
                                // write known words to json file
                                fs.writeFile(path.join(__dirname, '../storage/known_vocabulary.json'), known_vocabulary, (err) => {
                                    if (err) {
                                        throw err;
                                    }
                                });
                            }
                        } else {
                            // then entered word was incorrect
                            console.log(`⛔️ Uppps! The right word was ${translation}`)
                        }
                    })
                    .catch(e => console.log(e))
            
            // the user wants to look at new words
            } else if (answers.practice == 'New words') {
                // the promt to look at the new word and its translation
                await inquirer.prompt([{
                    name: word,
                    type: 'confirm',
                    message: `"${word}" means "${translation}" in ${Object.keys(data[i])[0]}`
                }])
                .catch(e => console.log(e))
            } else {
                console.log('error')
            }
        }
    
    // the user wants to learn new vocabulary without spoken words (new words -> known words)
    } else if (answers.method == 'New language') {

        // load either vocabulary from the csv for new words or from memory for known words (json)
        if (answers.practice == 'Practice' || 'New words') {
            // for more info on readCsv() in functions.js
            data = await readCsv(path.join(__dirname, `../languages/${answers.language}.csv`))
        } else if (answers.practice == 'Known words') {
            data = JSON.parse(path.join(__dirname, '../storage/known_vocabulary.json'))
        }

        // iterare over the vocabulary from csv or json
        for (let i = 0; i < data.length; i++) {

            // the word from the language the user is learning
            word = data[i][Object.keys(data[i])[0]]
            // the translation of that word to a language the user knows
            translation = data[i][Object.keys(data[i])[1]]

            // ask question about the current word 
            // the user wants to practice new or known words
            if (answers.practice == 'Practice' || answers.practice == 'Known words') {
                // the promt to enter the translation of the current word
                await inquirer.prompt([{
                        name: word,
                        type: 'input',
                        message: `What does "${word}" mean in ${Object.keys(data[i])[1]}`
                    }])
                    .then(answer => {
                        // check if the entered word matches the translation - upper lower case dosen't matter
                        if (answer[word].toLowerCase() == translation.toLowerCase()) {
                            console.log('correct 🔥')

                            // read the json file with known vocabulary
                            let known_vocabulary = fs.readFileSync(path.join(__dirname, '../storage/known_vocabulary.json'));
                            known_vocabulary = JSON.parse(known_vocabulary);

                            // check if word already is in json - for more information about isInJson() see functions.js
                            if (!isInJson(word, known_vocabulary)) {
                                // add word to known vocabulary
                                known_vocabulary.push(data[i])
                                // write known words to json file
                                known_vocabulary = JSON.stringify(known_vocabulary)
                                fs.writeFile(path.join(__dirname, '../storage/known_vocabulary.json'), known_vocabulary, (err) => {
                                    if (err) {
                                        throw err;
                                    }
                                });
                            }
                        } else {
                            // then entered word was incorrect
                            console.log(`⛔️ Uppps! The right word was ${translation}`)
                        }
                    })
                    .catch(e => console.log(e))

            // the user wants to look at new words
            } else if (answers.practice == 'New words') {
                // the promt to look at the new word and its translation
                await inquirer.prompt([{
                        name: word,
                        type: 'confirm',
                        message: `"${word}" means "${translation}" in ${Object.keys(data[i])[0]}`
                    }])
                    .catch(e => console.log(e))
            } else {
                console.log('error')
            }
        }

    // the user wants to learn new vocabulary with spoken words (known words -> new words)
    } else if (answers.method == 'Known language') {

        // load either vocabulary from the csv for new words or from memory for known words (json)
        if (answers.practice == 'Practice' || 'New words') {
            // for more information on readCsv() go to functions.js
            data = await readCsv(path.join(__dirname, `../languages/${answers.language}.csv`))
        } else if (answers.practice == 'Known words') {
            data = JSON.parse(path.join(__dirname, '../storage/known_vocabulary.json'))
        }

        // iterare over the vocabulary from csv or json
        for (let i = 0; i < data.length; i++) {

            // the word from the language the user is learning
            word = data[i][Object.keys(data[i])[0]]
            // the translation of that word to a language the user knows
            translation = data[i][Object.keys(data[i])[1]]

            // ask question about the current word 
            // the user wants to practice new or known words
            if (answers.practice == 'Practice' || answers.practice == 'Known words') {
                // the promt to enter the translation of the current word
                await inquirer.prompt([{
                        name: word,
                        type: 'input',
                        message: `What does "${translation}" mean in ${Object.keys(data[i])[0]}`
                    }])
                    .then(answer => {
                        // check if the entered word matches the translation - upper lower case dosen't matter
                        if (answer[word] == data[i][word]) {
                            console.log('correct 🔥')

                            // read the json file with known vocabulary
                            let known_vocabulary = fs.readFileSync(path.join(__dirname, '../storage/known_vocabulary.json'));
                            known_vocabulary = JSON.parse(known_vocabulary);

                            // check if word already is in json - for more information about isInJson() see functions.js
                            if (!isInJson(word, known_vocabulary)) {
                                // add word to known vocabulary
                                known_vocabulary.push(data[i])
                                // write known words to json file
                                known_vocabulary = JSON.stringify(known_vocabulary)
                                fs.writeFile(path.join(__dirname, '../storage/known_vocabulary.json'), known_vocabulary, (err) => {
                                    if (err) {
                                        throw err;
                                    }
                                });
                            }
                        } else {
                            // then entered word was incorrect
                            console.log(`⛔️ Uppps! The right word was ${[word]}`)
                        }
                    })
                    .catch(e => console.log(e))

            // the user wants to look at new words
            } else if (answers.practice == 'New words') {
                // the promt to look at the new word and its translation
                await inquirer.prompt([{
                        name: word,
                        type: 'confirm',
                        message: `"${translation}" means "${word}" in ${Object.keys(data[i])[0]}`
                    }])
                    .catch(e => console.log(e))
            } else {
                console.log('error')
            }
        }
    }
})()