#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const util = require('util')
const inquirer = require('inquirer');
const textToSpeech = require('@google-cloud/text-to-speech');
const player = require('play-sound')(opts = {})
const { readCsv, listDir, getLangCode, isInJson } = require('./functions');
const { loadLang } = require('./scrap');

(async() => {

    let answers;
    let data;
    let word;
    let translation;
    let languages;
    let available;

    await listDir(path.join(__dirname, `../languages/`))
        .then((data) => {
            available = data.length
        })
        .catch(e => console.log(e))

    if (available == 0) {
        await inquirer.prompt([{
                name: 'lang',
                type: 'input',
                message: 'Which language do you want to add?'
            }])
            .then((async answer => {
                await loadLang(answer.lang)
                    .then(async() => {
                        console.log(`${answer.lang} was added to your languages 🥳`)
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
        await inquirer.prompt([{
                name: 'new',
                type: 'confirm',
                message: 'Do you want to load a new language?',
                default: false
            }])
            .then((async answer => {
                if (answer.new) {
                    await inquirer.prompt([{
                            name: 'lang',
                            type: 'input',
                            message: 'Which language do you want to add?'
                        }])
                        .then((async answer => {
                            await loadLang(answer.lang)
                                .then(async() => {
                                    console.log(`${answer.lang} was added to your languages 🥳`)
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
                    await listDir(path.join(__dirname, `../languages/`))
                        .then((data) => {
                            languages = data
                        })
                        .catch(e => console.log(e))
                }
            }))
    }

    await inquirer.prompt([{
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
            answers = a
        })
        .catch(e => console.log(e))

    if (answers.method == 'Speech') {

        if (answers.practice == 'Practice' || 'New words') {
            data = await readCsv(path.join(__dirname, `../languages/${answers.language}.csv`))
        } else if (answers.practice == 'Known words') {
            data = JSON.parse(path.join(__dirname, '../storage/known_vocabulary.json'))
        }

        for (let i = 0; i < data.length; i++) {

            word = data[i][Object.keys(data[i])[0]]
            translation = data[i][Object.keys(data[i])[1]]

            if (fs.existsSync(path.join(__dirname, `../audio/${word}.mp3`))) {
                player.play(path.join(__dirname, `../audio/${word}.mp3`), function(err) {
                    if (err) throw err
                })
            } else {
                let code = getLangCode(Object.keys(data[i])[0].split(',')[0])

                const client = new textToSpeech.TextToSpeechClient();

                const request = {
                    input: { text: word },
                    voice: { languageCode: code, ssmlGender: 'MALE' },
                    audioConfig: { audioEncoding: 'MP3' },
                };

                const [response] = await client.synthesizeSpeech(request);
                // Write the binary audio content to a local file
                dir = './audio'
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, {
                        recursive: true
                    });
                }
                const writeFile = util.promisify(fs.writeFile);
                await writeFile(path.join(__dirname, `../audio/${word}.mp3`), response.audioContent, 'binary').catch((err) => {
                    console.log("folder 'audio' not created")
                });
                player.play(path.join(__dirname, `../audio/${word}.mp3`), function(err) {
                    if (err) throw err
                })
            }

            if (answers.practice == 'Practice' || answers.practice == 'Known words') {
                await inquirer.prompt([{
                        name: word,
                        type: 'input',
                        message: `What does "${word}" mean in ${Object.keys(data[i])[1]}`
                    }])
                    .then(answer => {
                        if (answer[word] == translation) {
                            console.log('correct 🔥')

                            let known_vocabulary = fs.readFileSync(path.join(__dirname, '../storage/known_vocabulary.json'));
                            known_vocabulary = JSON.parse(known_vocabulary);

                            if (!isInJson(word, known_vocabulary)) {
                                known_vocabulary.push(data[i])
                                known_vocabulary = JSON.stringify(known_vocabulary)
                                fs.writeFile(path.join(__dirname, '../storage/known_vocabulary.json'), known_vocabulary, (err) => {
                                    if (err) {
                                        throw err;
                                    }
                                });
                            }
                        } else {
                            console.log(`⛔️ Uppps! The right word was ${translation}`)
                        }
                    })
                    .catch(e => console.log(e))

            } else if (answers.practice == 'New words') {
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

    } else if (answers.method == 'New language') {

        if (answers.practice == 'Practice' || 'New words') {
            data = await readCsv(path.join(__dirname, `../languages/${answers.language}.csv`))
        } else if (answers.practice == 'Known words') {
            data = JSON.parse(path.join(__dirname, '../storage/known_vocabulary.json'))
        }

        for (let i = 0; i < data.length; i++) {

            word = data[i][Object.keys(data[i])[0]]
            translation = data[i][Object.keys(data[i])[1]]

            if (answers.practice == 'Practice' || answers.practice == 'Known words') {
                await inquirer.prompt([{
                        name: word,
                        type: 'input',
                        message: `What does "${word}" mean in ${Object.keys(data[i])[1]}`
                    }])
                    .then(answer => {
                        if (answer[word] == data[i][translation]) {
                            console.log('correct 🔥')

                            let known_vocabulary = fs.readFileSync(path.join(__dirname, '../storage/known_vocabulary.json'));
                            known_vocabulary = JSON.parse(known_vocabulary);

                            if (!isInJson(word, known_vocabulary)) {
                                known_vocabulary.push(data[i])
                                known_vocabulary = JSON.stringify(known_vocabulary)
                                fs.writeFile(path.join(__dirname, '../storage/known_vocabulary.json'), known_vocabulary, (err) => {
                                    if (err) {
                                        throw err;
                                    }
                                });
                            }
                        } else {
                            console.log(`⛔️ Uppps! The right word was ${translation}`)
                        }
                    })
                    .catch(e => console.log(e))
            } else if (answers.practice == 'New words') {
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

    } else if (answers.method == 'Known language') {

        if (answers.practice == 'Practice' || 'New words') {
            data = await readCsv(path.join(__dirname, `../languages/${answers.language}.csv`))
        } else if (answers.practice == 'Known words') {
            data = JSON.parse(path.join(__dirname, '../storage/known_vocabulary.json'))
        }

        for (let i = 0; i < data.length; i++) {

            word = data[i][Object.keys(data[i])[0]]
            translation = data[i][Object.keys(data[i])[1]]

            if (answers.practice == 'Practice' || answers.practice == 'Known words') {
                await inquirer.prompt([{
                        name: word,
                        type: 'input',
                        message: `What does "${translation}" mean in ${Object.keys(data[i])[0]}`
                    }])
                    .then(answer => {
                        if (answer[word] == data[i][word]) {
                            console.log('correct 🔥')

                            let known_vocabulary = fs.readFileSync(path.join(__dirname, '../storage/known_vocabulary.json'));
                            known_vocabulary = JSON.parse(known_vocabulary);

                            if (!isInJson(word, known_vocabulary)) {
                                known_vocabulary.push(data[i])
                                known_vocabulary = JSON.stringify(known_vocabulary)
                                fs.writeFile(path.join(__dirname, '../storage/known_vocabulary.json'), known_vocabulary, (err) => {
                                    if (err) {
                                        throw err;
                                    }
                                });
                            }
                        } else {
                            console.log(`⛔️ Uppps! The right word was ${[word]}`)
                        }
                    })
                    .catch(e => console.log(e))
            } else if (answers.practice == 'New words') {
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