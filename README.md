# vocabulary trainer cli

A cli to practice vocabulary of a language

## Usage

`vocabulary-trainer sp-en`

## Add new languages

1. download or create a .csv file with new language, known language, hint (see example .csv)
2. place a .csv file into languages. The name should conform to the following convetion: new language-known language (sp-en).

## Setup

1. activate text to speech api in google cloud dashboard and create a service account
2. add service account key to PATH `export GOOGLE_APPLICATION_CREDENTIALS="[PATH]"`