import Axios from 'axios';
import { readFile, readFileSync } from 'fs';
import uuid from 'uuid/v1';

interface optionsObject {
	marked: number;
}

interface saramObject {
	id: string;
	type: string;
	output: string;
	command: string;
	user: string;
	comment: Array<string>;
	options: optionsObject;
	time: string;
}

interface saramInit {
	token: string;
	user: string;
	local?: boolean;
	baseUrl?: string;
}

interface methodTypes {
  comment?: string
  scriptName?: string
  [key: string]: any
}

class Saram {
	private token: string;
	private user: string;
	private local?: boolean;
  private baseUrl?: string;
  private url: string
  saramObject: saramObject

	constructor (options: saramInit) {
		this.token = options.token;
		this.user = options.user;
		this.local = options.local || false;
    this.baseUrl = options.baseUrl || '';
    this.url = `${this.checkDev()}${this.token}`
    this.saramObject = {
      id: uuid(),
      user: this.user,
      type: '',
      output: '',
      command: '',
      comment: ['SaramJs'],
      options: {
        marked: 2
      },
      time: new Date().toUTCString()
    }
    this.checkDev()
	}

  private checkDev =  () :void => {
    let getUrl = (url: string): void => {
      this.baseUrl = url
      this.url = `${url}${this.token}`
    }
    if (this.local) {
      getUrl('http://localhost:5001/')
    } else if (this.baseUrl){
      getUrl(this.baseUrl)
    } else {
      getUrl('https://saram.securisecctf.com/')
    }
  };

  readScriptSelf = (params: methodTypes = {}) : any => {
    let scriptPath = process.argv[1]
    let output = readFileSync(scriptPath, {
      encoding: 'utf8'
    })
    this.saramObject.command = params.scriptName || 'Script'
    this.saramObject.output = output
    this.saramObject.type = 'script'
    if (params.comment) {
      this.saramObject.comment.push(params.comment)
    }
    return this
  }
}


// test
// const a = new Saram({token: 'sometoken', user: 'lol', local: true});

// // console.log(a.test());
// console.log(a.saramObject, '\n\n');
// console.log(a.readScriptSelf({comment: 'hello', scriptName: 'someScript'}).saramObject);
