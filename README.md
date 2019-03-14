<img src="logo.png" width="150px">

[![Build Status](https://travis-ci.com/securisec/saramJs.svg?token=8GQfGnTK7S1NU7bKCqeR&branch=master)](https://travis-ci.com/securisec/saramJs)

# SaramJs
The node library to interact with `Saram`. Both Typescript and Javascipt can be used.

## Installation
```sh
npm i saramjs --save
```

## Usage

### Javascript
```javascript
// require Saram
const saramJs = require('../dist/index')
// Initialize a new Saram instance
const saram = new saramJs.Saram({
  token: 'someToken',
  user: 'someUser'
})

// Call any avaialble methods using 
saram.methodName() 
// Example: This will read the script itself and send to the server
saram.readScriptSelf().send()
```

### Typescript
```typescript
// Only difference between TS and JS is how it is imported
import { Saram } from '../index'
```