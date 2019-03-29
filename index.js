"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var axios_1 = require("axios");
var v1_1 = require("uuid/v1");
var fs_1 = require("fs");
var path_1 = require("path");
var child_process_1 = require("child_process");
var os_1 = require("os");
/**
 * The main class for Saram. token and user values are required.
 */
var Saram = /** @class */ (function () {
    /**
     *Creates an instance of Saram.
     * @param {init} options
     * @memberof Saram
     */
    function Saram(options) {
        var _this = this;
        /**
         * Reads the sets various values from the local Saram conf file
         */
        this.readConfig = function () {
            try {
                var c = JSON.parse(fs_1.readFileSync(_this.configPath, {
                    encoding: 'utf8'
                }));
                _this.key = c.apiKey;
                _this.user = c.username;
            }
            catch (error) { }
        };
        this.checkDev = function () {
            var getUrl = function (url) {
                _this.baseUrl = url;
                _this.url = "" + url + _this.token;
            };
            if (_this.local) {
                getUrl('http://localhost:5001/');
            }
            else if (_this.baseUrl) {
                getUrl(_this.baseUrl);
            }
            else {
                getUrl('https://saram.securisecctf.com/');
            }
        };
        /**
         * Strips out ansii color escape codes from stdout
         */
        this.cleanOutput = function (s) {
            return s.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').trim();
        };
        /**
         * Reads the contents of the whole script this method is called
         * in and makes it available to send to the Saram server
         *
         * @param {methodTypes} [params={}]
         * @returns {Saram}
         */
        this.readScriptSelf = function (params) {
            if (params === void 0) { params = {}; }
            var scriptPath = process.argv[1];
            var output = fs_1.readFileSync(scriptPath, {
                encoding: 'utf8'
            });
            _this.saramObject.command = params.scriptName || 'Script';
            _this.saramObject.output = output;
            _this.saramObject.type = 'script';
            if (params.comment) {
                _this.saramObject.comment.push(params.comment);
            }
            console.log(output);
            return _this;
        };
        /**
         * Method that returns the whole file of the file it is called in.
         *
         * @param {string} filePath A valid file path to read. Will not work with binary files
         * @param {methodTypes} [params={}] Optionally set a comment with `comment` param
         * @returns {Saram}
         */
        this.readFileContent = function (filePath, params) {
            if (params === void 0) { params = {}; }
            var output = fs_1.readFileSync(filePath, {
                encoding: 'utf8'
            });
            _this.saramObject.command = path_1.basename(filePath);
            _this.saramObject.output = output;
            _this.saramObject.type = 'file';
            if (params.comment) {
                _this.saramObject.comment.push(params.comment);
            }
            console.log(output);
            return _this;
        };
        /**
         * Function will send the variable of a JS/TS file to the server
         *
         * @param {*} variable The output from any script variable
         * @param {methodTypes} [params={}] Optionally set a comment with `comment` param
         * @returns {Saram}
         */
        this.variableOutput = function (variable, params) {
            if (params === void 0) { params = {}; }
            _this.saramObject.command = params.scriptName || 'Script';
            _this.saramObject.output = variable;
            _this.saramObject.type = 'script';
            if (params.comment) {
                _this.saramObject.comment.push(params.comment);
            }
            console.log(variable);
            return _this;
        };
        /**
         * Send the output of a command line command to the server
         *
         * @param {string} command The command to run
         * @param {methodTypes} [params={}] Optionally set a comment with `comment` param
         * @returns {Saram}
         */
        this.runCommand = function (command, params) {
            if (params === void 0) { params = {}; }
            var stdout = child_process_1.execSync(command).toString();
            var clean = _this.cleanOutput(stdout);
            _this.saramObject.command = command;
            _this.saramObject.output = clean;
            _this.saramObject.type = 'stdout';
            if (params.comment) {
                _this.saramObject.comment.push(params.comment);
            }
            console.log(clean);
            return _this;
        };
        /**
       * Sends the value of saramObject to the Saram server
       */
        this.sendToServer = function () {
            axios_1["default"]({
                method: 'patch',
                url: _this.url,
                data: _this.saramObject,
                headers: {
                    'x-saram-apikey': _this.key,
                    'x-saram-username': _this.user
                }
            })
                .then(function (res) {
                if (res.status === 200) {
                    console.log('Sent to server');
                }
            })["catch"](function (error) { return console.log(error); });
        };
        /**
       * Alias for sendToServer
         *
         * @memberof Saram
         */
        this.send = this.sendToServer;
        this.token = options.token;
        this.user = '';
        this.key = '';
        this.local = options.local || false;
        this.baseUrl = options.baseUrl;
        this.url = this.checkDev() + "api/" + this.token;
        this.configPath = os_1.homedir() + "/.saram.conf";
        this.checkDev();
        this.readConfig();
        this.saramObject = {
            id: v1_1["default"](),
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
    return Saram;
}());
exports.Saram = Saram;
/**
 * This class is intended to create the local `.saram.conf` file
 * which all Saram extentions/modules etc relies on.
 */
var SaramInit = /** @class */ (function (_super) {
    __extends(SaramInit, _super);
    /**
     *Creates an instance of SaramInit.
     * @param {string} apiKey
     * @param {boolean} [local] Set to true to use http://localhost:5001/
     * @param {string} [baseUrl] Set an arbitrary base url. Make sure to end with `/`
     * @memberof SaramInit
     */
    function SaramInit(apiKey, local, baseUrl) {
        var _this = _super.call(this, {
            token: '',
            local: local || false,
            baseUrl: baseUrl || ''
        }) || this;
        _this.apiKey = apiKey;
        return _this;
    }
    /**
     * The init method will create a `.saram.conf` file in the users
     * home directory using a valid API key and username.
     *
     * @memberof SaramInit
     */
    SaramInit.prototype.init = function () {
        var _this = this;
        axios_1["default"].post(this.url + "misc/valid/key", {
            key: this.apiKey
        })
            .then(function (res) {
            fs_1.writeFileSync(_this.configPath, JSON.stringify(res.data), {
                encoding: 'utf8'
            });
            console.log("Created " + _this.configPath);
        })["catch"](function (error) { return console.log('API key is not valid'); });
    };
    return SaramInit;
}(Saram));
exports.SaramInit = SaramInit;
/**
 * This class makes the whole API for Saram available.
 */
var SaramAPI = /** @class */ (function (_super) {
    __extends(SaramAPI, _super);
    /**
     *Creates an instance of SaramAPI.
     * @param {boolean} [local] Set to true to use http://localhost:5001/
     * @param {string} [baseUrl] Set an arbitrary base url. Make sure to end with `/`
     * @memberof SaramAPI
     */
    function SaramAPI(local, baseUrl) {
        var _this = _super.call(this, {
            token: '',
            local: local || false,
            baseUrl: baseUrl || ''
        }) || this;
        /**
         * Private method that generates a valid token
         */
        _this._generateToken = function (title) {
            var u = v1_1["default"]().slice(0, 8);
            var t = title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').join('-').slice(0, 25);
            return u + "-" + t;
        };
        /**
         * Gets an array of all the valid entries
         *
         * @returns {AxiosPromise} An Axios promise
         */
        _this.getAllEntries = function () {
            return _this.request({
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
        _this.getEntry = function (token) {
            return _this.request({
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
        _this.deleteEntry = function (token) {
            return _this.request({
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
        _this.createNewSection = function (data) {
            if (!_this.validTypes.includes(data.type)) {
                throw new Error("Invalid type. Valid types are " + _this.validTypes);
            }
            var payload = {
                id: v1_1["default"](),
                type: data.type,
                output: data.output,
                command: data.command,
                user: _this.user,
                comment: data.comment || ['saramJs'],
                options: {
                    marked: 2
                },
                time: new Date().toUTCString()
            };
            return _this.request({
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
        _this.addComment = function (token, dataid, comment) {
            return _this.request({
                method: 'patch',
                url: token + "/" + dataid + "/comment",
                data: { data: comment }
            });
        };
        /**
         * Delete a section. This will delete a single section in an entry
         *
         * @param {string} token A valid toekn for the entry
         * @param {string} dataid The dataid of the section to delete
         * @returns {AxiosPromise} An Axios promise
         */
        _this.deleteSection = function (token, dataid) {
            return _this.request({
                method: 'delete',
                url: token + "/" + dataid
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
        _this.createNewEntry = function (title, category, slackLink) {
            if (!_this.validCategories.includes(category)) {
                throw new Error("Not a valid category. Valid categories are " + _this.validCategories);
            }
            var newToken = _this._generateToken(title);
            var payload = {
                title: title,
                category: category,
                slackLink: slackLink || '',
                timeCreate: new Date().toUTCString(),
                data: []
            };
            return _this.request({
                method: 'post',
                url: "create/" + newToken,
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
        _this.resetApiKey = function (oldApiKey, username) {
            var payload = {
                apiKey: oldApiKey,
                username: username
            };
            return _this.request({
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
        _this.changeUserName = function (apiKey, oldUserName, newUserName) {
            return _this.request({
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
        _this.validateApiKey = function (apiKey) {
            return axios_1["default"]({
                method: 'post',
                url: _this.baseUrl + "misc/valid/key",
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
        _this.getValidToken = function (title) {
            return _this._generateToken(title);
        };
        _this.headers = {
            'x-saram-apikey': _this.key,
            'x-saram-username': _this.user
        };
        _this.apiUrl = _this.url + "api/";
        _this.request = axios_1["default"].create({
            headers: _this.headers,
            baseURL: _this.apiUrl
        });
        _this.validTypes = ['file', 'stdout', 'script', 'dump', 'tool', 'image'];
        _this.validCategories = [
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
        return _this;
    }
    return SaramAPI;
}(Saram));
exports.SaramAPI = SaramAPI;
