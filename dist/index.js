"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const v1_1 = __importDefault(require("uuid/v1"));
const fs_1 = require("fs");
const path_1 = require("path");
const child_process_1 = require("child_process");
const os_1 = require("os");
/**
 * The main class for Saram. token and user values are required.
 */
class Saram {
    constructor(options) {
        this.readConfig = () => {
            try {
                let c = JSON.parse(fs_1.readFileSync(this.configPath, {
                    encoding: 'utf8'
                }));
                this.key = c.apiKey;
                this.user = c.username;
            }
            catch (error) {
                throw new Error('Cannot find saram config file. Use SaramInit to set it up');
            }
        };
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
        this.cleanOutput = (s) => {
            return s.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').trim();
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
            console.log(output);
            return this;
        };
        /**
       * Method that returns the whole file of the file it is called in.
       */
        this.readFileContent = (filePath, params = {}) => {
            let output = fs_1.readFileSync(filePath, {
                encoding: 'utf8'
            });
            this.saramObject.command = path_1.basename(filePath);
            this.saramObject.output = output;
            this.saramObject.type = 'file';
            if (params.comment) {
                this.saramObject.comment.push(params.comment);
            }
            console.log(output);
            return this;
        };
        /**
       * Function will send the variable of a JS/TS file to the server
       */
        this.variableOutput = (variable, params = {}) => {
            this.saramObject.command = params.scriptName || 'Script';
            this.saramObject.output = variable;
            this.saramObject.type = 'script';
            if (params.comment) {
                this.saramObject.comment.push(params.comment);
            }
            console.log(variable);
            return this;
        };
        /**
       * Send the output of a command line command to the server
       */
        this.runCommand = (command, params = {}) => {
            let stdout = child_process_1.execSync(command).toString();
            let clean = this.cleanOutput(stdout);
            this.saramObject.command = command;
            this.saramObject.output = clean;
            this.saramObject.type = 'stdout';
            if (params.comment) {
                this.saramObject.comment.push(params.comment);
            }
            console.log(clean);
            return this;
        };
        /**
       * Sends the value of saramObject to the Saram server
       */
        this.sendToServer = () => {
            axios_1.default({
                method: 'patch',
                url: this.url,
                data: this.saramObject,
                headers: {
                    'x-saram-apikey': this.key
                }
            })
                .then((res) => {
                if (res.status === 200) {
                    console.log('Sent to server');
                }
            })
                .catch((error) => console.log(error));
        };
        /**
       * Alias for sendToServer
       */
        this.send = this.sendToServer;
        this.token = options.token;
        this.user = '';
        this.key = '';
        this.local = options.local || false;
        this.baseUrl = options.baseUrl;
        this.url = `${this.checkDev()}${this.token}`;
        this.configPath = `${os_1.homedir()}/.saram.conf`;
        this.checkDev();
        this.readConfig();
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
    }
}
exports.Saram = Saram;
class SaramInit extends Saram {
    constructor({ apiKey, local, baseUrl }) {
        super({
            token: '',
            local: local || false,
            baseUrl: baseUrl || ''
        });
        this.apiKey = apiKey;
    }
    init() {
        axios_1.default.post(`${this.url}misc/valid/key`, {
            key: this.apiKey
        })
            .then((res) => {
            fs_1.writeFileSync(this.configPath, JSON.stringify(res.data), {
                encoding: 'utf8'
            });
            console.log(`Created ${this.configPath}`);
        })
            .catch((error) => console.log('API key is not valid'));
    }
}
exports.SaramInit = SaramInit;
