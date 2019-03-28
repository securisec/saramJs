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
        /**
         * Reads the sets various values from the local Saram conf file
         */
        this.readConfig = () => {
            try {
                let c = JSON.parse(fs_1.readFileSync(this.configPath, {
                    encoding: 'utf8'
                }));
                this.key = c.apiKey;
                this.user = c.username;
            }
            catch (error) { }
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
        /**
         * Strips out ansii color escape codes from stdout
         */
        this.cleanOutput = (s) => {
            return s.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').trim();
        };
        /**
         * Reads the contents of the whole script this method is called
         * in and makes it available to send to the Saram server
         */
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
                    'x-saram-apikey': this.key,
                    'x-saram-username': this.user
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
        this.url = `${this.checkDev()}api/${this.token}`;
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
/**
 * This class is intended to create the local `.saram.conf` file
 * which all Saram extentions/modules etc relies on.
 */
class SaramInit extends Saram {
    constructor({ apiKey, local, baseUrl }) {
        super({
            token: '',
            local: local || false,
            baseUrl: baseUrl || ''
        });
        this.apiKey = apiKey;
    }
    /**
     * The init method will create a `.saram.conf` file in the users
     * home directory using a valid API key and username.
     */
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
/**
 * This class makes the whole API for Saram available.
 */
class SaramAPI extends Saram {
    constructor({ local, baseUrl }) {
        super({
            token: '',
            local: local || false,
            baseUrl: baseUrl || ''
        });
        /**
         * Private method that generates a valid token
         */
        this._generateToken = (title) => {
            var u = v1_1.default().slice(0, 8);
            var t = title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').join('-').slice(0, 25);
            return `${u}-${t}`;
        };
        /**
         * Gets an array of all the valid entries
         */
        this.getAllEntries = () => {
            return this.request({
                method: 'get',
                url: '/all/entries'
            });
        };
        /**
         * Gets all the data associated with a single entry
         */
        this.getEntry = (token) => {
            return this.request({
                method: 'get',
                url: token
            });
        };
        /**
         * Delete an entry entirely
         */
        this.deleteEntry = (token) => {
            return this.request({
                method: 'delete',
                url: token
            });
        };
        /**
         * Create a new section. This will add to the existing entry.
         */
        this.createNewSection = (data) => {
            if (!this.validTypes.includes(data.type)) {
                throw new Error(`Invalid type. Valid types are ${this.validTypes}`);
            }
            let payload = {
                id: v1_1.default(),
                type: data.type,
                output: data.output,
                command: data.command,
                user: this.user,
                comment: data.comment || ['saramJs'],
                options: {
                    marked: 2
                },
                time: new Date().toUTCString()
            };
            return this.request({
                method: 'patch',
                url: data.token,
                data: payload
            });
        };
        /**
         * Add a comment to an existing section
         */
        this.addComment = ({ token, dataid, comment }) => {
            return this.request({
                method: 'patch',
                url: `${token}/${dataid}/comment`,
                data: { data: comment }
            });
        };
        /**
         * Delete a section. This will delete a single section in an entry
         */
        this.deleteSection = ({ token, dataid }) => {
            return this.request({
                method: 'delete',
                url: `${token}/${dataid}`
            });
        };
        /**
         * Create a new entry. This is a whole new entry to work with
         */
        this.createNewEntry = ({ title, category, slackLink }) => {
            if (!this.validCategories.includes(category)) {
                throw new Error(`Not a valid category. Valid categories are ${this.validCategories}`);
            }
            let newToken = this._generateToken(title);
            let payload = {
                title: title,
                category: category,
                slackLink: slackLink || '',
                timeCreate: new Date().toUTCString(),
                data: []
            };
            return this.request({
                method: 'post',
                url: `create/${newToken}`,
                data: payload
            });
        };
        /**
         * Reset the API key
         */
        this.resetApiKey = ({ oldApiKey, username }) => {
            let payload = {
                apiKey: oldApiKey,
                username: username
            };
            return this.request({
                method: 'post',
                url: 'reset/key',
                data: payload
            });
        };
        /**
         * Changes the username. Accepts a valid API key, a valid
         * current username and the new username. Returns a new username
         */
        this.changeUserName = ({ apiKey, oldUserName, newUserName }) => {
            return this.request({
                method: 'post',
                url: 'reset/username',
                data: {
                    apiKey: apiKey,
                    username: oldUserName,
                    newUsername: newUserName
                }
            });
        };
        /**
         * Validates an API key, and returns the key and associated
         * username on success.
         */
        this.validateApiKey = (apiKey) => {
            return axios_1.default({
                method: 'post',
                url: `${this.baseUrl}misc/valid/key`,
                data: { key: apiKey }
            });
        };
        /**
         * Generate a valid token
         */
        this.getValidToken = (title) => {
            return this._generateToken(title);
        };
        this.headers = {
            'x-saram-apikey': this.key,
            'x-saram-username': this.user
        };
        this.apiUrl = `${this.url}api/`;
        this.request = axios_1.default.create({
            headers: this.headers,
            baseURL: this.apiUrl
        });
        this.validTypes = ['file', 'stdout', 'script', 'dump', 'tool', 'image'];
        this.validCategories = [
            'android',
            'cryptography',
            'firmware',
            'forensics',
            'hardware',
            'ios',
            'misc',
            'network',
            'pcap',
            'pwn',
            'reversing',
            'stego',
            'web',
            'none',
            'other',
            'scripting'
        ];
    }
}
exports.SaramAPI = SaramAPI;
