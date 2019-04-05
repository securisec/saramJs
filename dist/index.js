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
 * If the .saram.conf file is not found in the home directory, it
 * will throw an error.
 */
class Saram {
    /**
     * Token of the entry to work with
     *
     * @type {string}
     * @memberof init
     */
    constructor(token) {
        /**
         * Strips out ansii color escape codes from stdout
         */
        this.cleanOutput = (s) => {
            return s.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').trim();
        };
        /**
         * Reads the contents of the whole script this method is called
         * in and makes it available to send to the Saram server
         *
         * @param {methodTypes} [params={}]
         * @returns {Saram}
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
                this.saramObject.comment.push({
                    text: params.comment,
                    username: this.user,
                    avatar: this.avatar
                });
            }
            console.log(output);
            return this;
        };
        /**
         * Method that returns the whole file of the file it is called in.
         *
         * @param {string} filePath A valid file path to read. Will not work with binary files
         * @param {methodTypes} [params={}] Optionally set a comment with `comment` param
         * @returns {Saram}
         */
        this.readFileContent = (filePath, params = {}) => {
            let output = fs_1.readFileSync(filePath, {
                encoding: 'utf8'
            });
            this.saramObject.command = path_1.basename(filePath);
            this.saramObject.output = output;
            this.saramObject.type = 'file';
            if (params.comment) {
                this.saramObject.comment.push({
                    text: params.comment,
                    username: this.user,
                    avatar: this.avatar
                });
            }
            console.log(output);
            return this;
        };
        /**
         * Function will send the variable of a JS/TS file to the server
         *
         * @param {*} variable The output from any script variable
         * @param {methodTypes} [params={}] Optionally set a comment with `comment` param
         * @returns {Saram}
         */
        this.variableOutput = (variable, params = {}) => {
            this.saramObject.command = params.scriptName || 'Script';
            this.saramObject.output = variable;
            this.saramObject.type = 'script';
            if (params.comment) {
                this.saramObject.comment.push({
                    text: params.comment,
                    username: this.user,
                    avatar: this.avatar
                });
            }
            console.log(variable);
            return this;
        };
        /**
         * Send the output of a command line command to the server
         *
         * @param {string} command The command to run
         * @param {methodTypes} [params={}] Optionally set a comment with `comment` param
         * @returns {Saram}
         */
        this.runCommand = (command, params = {}) => {
            let stdout = child_process_1.execSync(command).toString();
            let clean = this.cleanOutput(stdout);
            this.saramObject.command = command;
            this.saramObject.output = clean;
            this.saramObject.type = 'stdout';
            if (params.comment) {
                this.saramObject.comment.push({
                    text: params.comment,
                    username: this.user,
                    avatar: this.avatar
                });
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
         *
         * @memberof Saram
         */
        this.send = this.sendToServer;
        this.token = token;
        this.configPath = `${os_1.homedir()}/.saram.conf`;
        let c = JSON.parse(fs_1.readFileSync(this.configPath, {
            encoding: 'utf8'
        }));
        this.key = c.apiKey;
        this.user = c.username;
        this.baseUrl = c.base_url;
        this.url = `${this.baseUrl}api/${this.token}`;
        this.avatar = c.avatar || '/static/saramjs.png';
        this.saramObject = {
            id: v1_1.default(),
            user: this.user,
            type: '',
            output: '',
            command: '',
            comment: [
                {
                    text: 'saramJs',
                    username: this.user,
                    avatar: this.avatar
                }
            ],
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
class SaramInit {
    /**
     *Creates an instance of SaramInit.
     * @param {string} apiKey a valid api key
     * @param {boolean} [local] set to true to use localhost as base url
     * @param {string} [base_url] set the base url. Otherwise the default Saram url is used
     */
    constructor({ apiKey, local, base_url }) {
        this.apiKey = apiKey;
        this.local = local || false;
        if (this.local) {
            this.base_url = 'http://localhost:5001/';
        }
        else if (base_url) {
            this.base_url = base_url;
        }
        else {
            this.base_url = 'https://app.saram.io/';
        }
        this.configPath = `${os_1.homedir()}/.saram.conf`;
    }
    /**
     * The init method will create a `.saram.conf` file in the users
     * home directory using a valid API key and username.
     *
     * @memberof SaramInit
     */
    init() {
        let url = `${this.base_url}misc/valid/key`;
        axios_1.default.post(url, {
            key: this.apiKey
        })
            .then((res) => {
            let conf = res.data;
            conf.base_url = this.base_url;
            fs_1.writeFileSync(this.configPath, JSON.stringify(conf), {
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
    /**
     *Creates an instance of SaramAPI.
     * @memberof SaramAPI
     */
    constructor() {
        super('');
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
         *
         * @returns {AxiosPromise} An Axios promise
         */
        this.getAllEntries = () => {
            return this.request({
                method: 'get',
                url: '/all/entries'
            });
        };
        /**
         * Gets all the data associated with a single entry
         *
         * @param {string} token A valid entry token
         * @returns {AxiosPromise} An Axios promise
         */
        this.getEntry = (token) => {
            return this.request({
                method: 'get',
                url: token
            });
        };
        /**
         * Delete an entry entirely
         *
         * @param {string} token A valid entry token
         * @returns {AxiosPromise} An Axios promise
         */
        this.deleteEntry = (token) => {
            return this.request({
                method: 'delete',
                url: token
            });
        };
        /**
         *
         * Create a new section. This will add to the existing entry.
         *
         * @param {CreateNewSection} data
         * @returns {AxiosPromise} An Axios promise
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
                comment: [
                    {
                        text: data.comment,
                        username: this.user,
                        avatar: this.avatar
                    }
                ],
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
         *
         * @param {string} token The token for the entry
         * @param {string} dataid The dataid for the section
         * @param {string} comment Comment to add
         * @returns {AxiosPromise} An Axios promise
         */
        this.addComment = (token, dataid, comment) => {
            return this.request({
                method: 'patch',
                url: `${token}/${dataid}/comment`,
                data: {
                    data: {
                        text: comment,
                        username: this.user,
                        avatar: this.avatar
                    }
                }
            });
        };
        /**
         * Delete a section. This will delete a single section in an entry
         *
         * @param {string} token A valid toekn for the entry
         * @param {string} dataid The dataid of the section to delete
         * @returns {AxiosPromise} An Axios promise
         */
        this.deleteSection = (token, dataid) => {
            return this.request({
                method: 'delete',
                url: `${token}/${dataid}`
            });
        };
        /**
         * Create a new entry. This is a whole new entry to work with
         *
         * @param {string} title The title of the entry
         * @param {string} category A valid category
         * @param {string} [slackLink] Optional Slack or reference link
         * @returns {AxiosPromise} An Axios promise
         */
        this.createNewEntry = (title, category, slackLink) => {
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
         *
         * @param {string} oldApiKey The current API key
         * @param {string} username The current username
         * @returns {AxiosPromise}
         */
        this.resetApiKey = (oldApiKey, username) => {
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
         *
         * @param {string} apiKey A valid API key
         * @param {string} oldUserName The previous username
         * @param {string} newUserName The new username
         * @returns {AxiosPromise} An Axios promise
         */
        this.changeUserName = (apiKey, oldUserName, newUserName) => {
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
         *
         * @param {string} apiKey A valid API key
         * @returns {AxiosPromise} an Axios promise
         */
        this.validateApiKey = (apiKey) => {
            return axios_1.default({
                method: 'post',
                url: `${this.baseUrl}misc/valid/key`,
                data: { key: apiKey }
            });
        };
        /**
         * Generate a valid token. These can be used for testing
         * or for other methods that require a valid token
         *
         * @param {string} title The title of the section/challenge
         * @returns {string} a valid token
         */
        this.getValidToken = (title) => {
            return this._generateToken(title);
        };
        this.headers = {
            'x-saram-apikey': this.key,
            'x-saram-username': this.user
        };
        this.apiUrl = `${this.url}`;
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
