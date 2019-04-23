"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const fs_1 = require("fs");
const path_1 = require("path");
const child_process_1 = require("child_process");
const os_1 = require("os");
const crypto_1 = require("crypto");
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
                    text: params.comment || 'saramJs',
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
                    text: params.comment || 'saramJs',
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
                    text: params.comment || 'saramJs',
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
                    text: params.comment || 'saramJs',
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
            ]
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
            fs_1.writeFileSync(this.configPath, JSON.stringify(conf, null, 2), {
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
            var u = crypto_1.randomBytes(20).toString('hex').slice(0, 8);
            var t = title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').join('-').slice(0, 25);
            return `${u}-${t}`;
        };
        /**
         *Gets an array of all the valid entries
         *
         * @returns {Promise<object>} A promise with the results
         */
        this.getAllEntries = () => {
            return new Promise((resolve, reject) => {
                this.request({
                    method: 'get',
                    url: '/all/entries'
                })
                    .then((res) => {
                    resolve(res.data);
                })
                    .catch((error) => reject(error.response.data));
            });
        };
        /**
         * Gets all the data associated with a single entry
         *
         * @param {string} token A valid entry token
         * @returns {Promise<object>} A promise with the results
         */
        this.getEntry = (token) => {
            return new Promise((resolve, reject) => {
                this.request({
                    method: 'get',
                    url: token
                })
                    .then((res) => {
                    resolve(res.data);
                })
                    .catch((error) => reject(error.response.data));
            });
        };
        /**
         * Delete an entry entirely
         *
         * @param {string} token A valid entry token
         * @returns {Promise<object>} A promise with the results
         */
        this.deleteEntry = (token) => {
            return new Promise((resolve, reject) => {
                this.request({
                    method: 'delete',
                    url: token
                })
                    .then((res) => {
                    resolve(res.data);
                })
                    .catch((error) => reject(error.response.data));
            });
        };
        /**
         *Update an existing entry.
         *
         * @memberof SaramAPI
         */
        this.updateEntry = ({ token, description, priority }) => {
            return new Promise((resolve, reject) => {
                this.request({
                    method: 'post',
                    url: token,
                    data: {
                        description: description,
                        priority: priority || 'none'
                    }
                })
                    .then((res) => {
                    resolve(res.data);
                })
                    .catch((error) => reject(error.response.data));
            });
        };
        /**
         *
         * Create a new section. This will add to the existing entry.
         *
         * @param {CreateNewSection} data
         * @returns {Promise<object>} A promise with the results
         */
        this.createNewSection = (data) => {
            let payload = {
                type: data.type,
                output: data.output,
                command: data.command,
                user: this.user,
                comment: [
                    {
                        text: data.comment || 'saramJs',
                        username: this.user,
                        avatar: this.avatar
                    }
                ]
            };
            return new Promise((resolve, reject) => {
                this.request({
                    method: 'patch',
                    url: data.token,
                    data: payload
                })
                    .then((res) => {
                    resolve(res.data);
                })
                    .catch((error) => reject(error.response.data));
            });
        };
        /**
         * Add a comment to an existing section
         *
         * @param {string} token The token for the entry
         * @param {string} dataid The dataid for the section
         * @param {string} comment Comment to add
         * @returns {Promise<object>} A promise with the results
         */
        this.addComment = (token, dataid, comment) => {
            return new Promise((resolve, reject) => {
                this.request({
                    method: 'patch',
                    url: `${token}/${dataid}/comment`,
                    data: {
                        data: {
                            text: comment || 'saramJs',
                            username: this.user,
                            avatar: this.avatar
                        }
                    }
                })
                    .then((res) => {
                    resolve(res.data);
                })
                    .catch((error) => reject(error.response.data));
            });
        };
        /**
         * Delete a section. This will delete a single section in an entry
         *
         * @param {string} token A valid toekn for the entry
         * @param {string} dataid The dataid of the section to delete
         * @returns {Promise<object>} A promise with the results
         */
        this.deleteSection = (token, dataid) => {
            return new Promise((resolve, reject) => {
                this.request({
                    method: 'delete',
                    url: `${token}/${dataid}`
                })
                    .then((res) => {
                    resolve(res.data);
                })
                    .catch((error) => reject(error.response.data));
            });
        };
        /**
         * Create a new entry. This is a whole new entry to work with
         *
         * @param {string} title The title of the entry
         * @param {string} category A valid category
         * @returns {Promise<object>} A promise with the results
         */
        this.createNewEntry = (title, category) => {
            let newToken = this._generateToken(title);
            let payload = {
                title: title,
                category: category
            };
            return new Promise((resolve, reject) => {
                this.request({
                    method: 'post',
                    url: `create/${newToken}`,
                    data: payload
                })
                    .then((res) => {
                    resolve(res.data);
                })
                    .catch((error) => reject(error.response.data));
            });
        };
        /**
         * Reset the API key
         *
         * @param {string} oldApiKey The current API key
         * @param {string} username The current username
         * @returns {Promise<object>} A promise with the results
         */
        this.resetApiKey = (oldApiKey, username) => {
            let payload = {
                apiKey: oldApiKey,
                username: username
            };
            return new Promise((resolve, reject) => {
                this.request({
                    method: 'post',
                    url: 'reset/key',
                    data: payload
                })
                    .then((res) => {
                    resolve(res.data);
                })
                    .catch((error) => reject(error.response.data));
            });
        };
        /**
         *Reset the password for the user. If the user used a federated
         *identity, they can then use the password to log in locally
         *
         * @param {string} password A valid password string
         * @returns {Promise<object>} A promise with the results
         */
        this.resetPassword = (password) => {
            let payload = {
                apiKey: this.key,
                username: this.user,
                password: password
            };
            return new Promise((resolve, reject) => {
                this.request({
                    method: 'post',
                    url: 'reset/password',
                    data: payload
                })
                    .then((res) => {
                    resolve(res.data);
                })
                    .catch((error) => reject(error.response.data));
            });
        };
        /**
         * Changes the username. Accepts a valid API key, a valid
         * current username and the new username. Returns a new username
         *
         * @param {string} apiKey A valid API key
         * @param {string} oldUserName The previous username
         * @param {string} newUserName The new username
         * @returns {Promise<object>} A promise with the results
         */
        this.changeUserName = (apiKey, oldUserName, newUserName) => {
            return new Promise((resolve, reject) => {
                this.request({
                    method: 'post',
                    url: 'reset/username',
                    data: {
                        apiKey: apiKey,
                        username: oldUserName,
                        newUsername: newUserName
                    }
                })
                    .then((res) => {
                    resolve(res.data);
                })
                    .catch((error) => reject(error.response.data));
            });
        };
        /**
         * Validates an API key, and returns the key and associated
         * username on success.
         *
         * @param {string} apiKey A valid API key
         * @returns {Promise<object>} A promise with the results
         */
        this.validateApiKey = (apiKey) => {
            return new Promise((resolve, reject) => {
                axios_1.default({
                    method: 'post',
                    url: `${this.baseUrl}misc/valid/key`,
                    data: { key: apiKey }
                })
                    .then((res) => {
                    resolve(res.data);
                })
                    .catch((error) => reject(error.response.data));
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
        /**
         *Get an arroy of objects of all the users
         *
         * @returns {Promise<object>}
         */
        this.adminGetAllUsers = () => {
            return new Promise((resolve, reject) => {
                this.request({
                    method: 'get',
                    url: 'admin/allusers'
                })
                    .then((res) => {
                    resolve(res.data);
                })
                    .catch((error) => reject(error.response.data));
            });
        };
        /**
         *Get all the information available for a specific user.
         *
         * @param {string} userId A valid user id
         * @returns {Promise<object>}
         */
        this.adminFindUser = (userId) => {
            return new Promise((resolve, reject) => {
                this.request({
                    method: 'get',
                    url: `admin/user?id=${userId}`
                })
                    .then((res) => {
                    resolve(res.data);
                })
                    .catch((error) => reject(error.response.data));
            });
        };
        /**
         *Create a new user. Returns an Promise<object> which when resolved will
         * the created users object.
         *
         * @param {string} username A valid username. Sepcial characters/spaces are removed
         * @param {string} password A valid password. Passwords are stored as a hash
         * @param {boolean} [isAdmin] `true` if admin. `false` by default
         * @param {string} [avatar] A valid image URL for the profile image. Defaults to Saram logo.
         * @returns {Promise<object>} Axios promise. Resolves to created user object
         */
        this.adminCreateUser = (username, password, isAdmin, avatar) => {
            return new Promise((resolve, reject) => {
                this.request({
                    method: 'post',
                    url: 'admin/user',
                    data: {
                        username: username,
                        password: password,
                        isAdmin: isAdmin || false,
                        avatar: avatar || ''
                    }
                })
                    .then((res) => {
                    resolve(res.data);
                })
                    .catch((error) => reject(error.response.data));
            });
        };
        /**
         *Delete a user from the database
         *
         * @param {string} userId A valid user id.
         * @returns {Promise<object>} A promise with the results
         */
        this.adminDeleteUser = (userId) => {
            return new Promise((resolve, reject) => {
                this.request({
                    method: 'delete',
                    url: 'admin/user',
                    data: {
                        user_id: userId
                    }
                })
                    .then((res) => {
                    resolve(res.data);
                })
                    .catch((error) => reject(error.response.data));
            });
        };
        /**
         *Get an array of all the API interaction logs
         *
         * @returns {Promise<object>} An array of log objects
         */
        this.getLogs = () => {
            return new Promise((resolve, reject) => {
                this.request({
                    method: 'get',
                    url: 'admin/logs'
                })
                    .then((res) => {
                    resolve(res.data);
                })
                    .catch((error) => reject(error.response.data));
            });
        };
        /**
         *Get an array of objects show the server status
         *
         * @returns {Promise<object>}
         */
        this.getServerStatus = () => {
            return new Promise((resolve, reject) => {
                this.request({
                    method: 'get',
                    url: 'admin/status'
                })
                    .then((res) => {
                    resolve(res.data);
                })
                    .catch((error) => reject(error.response.data));
            });
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
    }
}
exports.SaramAPI = SaramAPI;
