"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const v1_1 = __importDefault(require("uuid/v1"));
class Saram {
    constructor(options) {
        this.checkDev = () => {
            let getUrl = (url) => {
                this.baseUrl = url;
                this.url = `${url}${this.token}`;
            };
            if (this.local) {
                getUrl('http://localhost:5001/');
            }
            else if (this.baseUrl) {
                getUrl(this.baseUrl);
            }
            else {
                getUrl('https://saram.securisecctf.com/');
            }
        };
        this.readScriptSelf = (params = {}) => {
            let scriptPath = process.argv[1];
            let output = fs_1.readFileSync(scriptPath, {
                encoding: 'utf8'
            });
            this.saramObject.command = params.scriptName || 'Script';
            this.saramObject.output = output;
            this.saramObject.type = 'script';
            if (params.comment) {
                this.saramObject.comment.push(params.comment);
            }
            return this;
        };
        this.token = options.token;
        this.user = options.user;
        this.local = options.local || false;
        this.baseUrl = options.baseUrl || '';
        this.url = `${this.checkDev()}${this.token}`;
        this.saramObject = {
            id: v1_1.default(),
            user: this.user,
            type: '',
            output: '',
            command: '',
            comment: ['SaramJs'],
            options: {
                marked: 2
            },
            time: new Date().toUTCString()
        };
        this.checkDev();
    }
}
// test
// const a = new Saram({token: 'sometoken', user: 'lol', local: true});
// // console.log(a.test());
// console.log(a.saramObject, '\n\n');
// console.log(a.readScriptSelf({comment: 'hello', scriptName: 'someScript'}).saramObject);
