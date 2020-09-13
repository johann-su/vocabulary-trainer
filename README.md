# vocabulary trainer cli

A cli to practice vocabulary of a language

## Usage

`vocabulary-trainer`

## Add new languages

1. take example.csv file and add your vocabulary
2. place it in the languages folder with the name new language-known language.csv (sp-en.csv)

## Setup

1. activate text to speech api in google cloud dashboard and create a service account
2. add service account key to PATH `export GOOGLE_APPLICATION_CREDENTIALS="[PATH]"`
3. cd into this project and run `npm link`
