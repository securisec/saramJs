<img src="https://raw.githubusercontent.com/securisec/saramJs/master/logo.png" width="150px">

[![Build Status](https://travis-ci.com/securisec/saramJs.svg?token=8GQfGnTK7S1NU7bKCqeR&branch=master)](https://travis-ci.com/securisec/saramJs)

# SaramJs
The node library to interact with `Saram`. Both Typescript and Javascipt can be used.

This library exports three main classes.
- Saram
- SaramInit
- SaramAPI

The `Saram` class is primary used to interact with the `Saram` server, and send it various output from commands run, files read, or script variables. This class simplifies the use of the `Saram` API.

The `SaramInit` class is purely intended to set the `.saram.conf` file which all modules of `Saram` relies on.

The `SaramAPI` class exposes the entire `Saram` API to be used programmatically. 

## Installation
```sh
npm i saramjs --save
```

## Usage

### Before use
saramJs relies of obtaining the API key and username from a local config file. To set up this config file, use:
```javascript
const {SaramInit} = require('saramjs')
SaramInit('yourApiKey').init()
```
This will create the local creds file for you. 

### Javascript
```javascript
// require Saram
const {Saram} = require('saramjs')
// Initialize a new Saram instance
const saram = new saramJs.Saram({
  token: 'someToken',
})

// Call any avaialble methods using 
saram.methodName() 
// Example: This will read the script itself and send to the server
saram.readScriptSelf().send()
```

### Typescript
```typescript
// Only difference between TS and JS is how it is imported
import { Saram } from 'saramjs'
```

## Docs
Docs are available [here](https://saramjs.docs.securisec.net)
To generate docs using [Typedoc](https://typedoc.org/), use 
```
npm run docs
```