import Axios, { AxiosInstance, AxiosResponse, AxiosPromise } from 'axios';
import uuid from 'uuid/v1';
import { readFileSync, writeFileSync } from 'fs';
import { basename } from 'path';
import { execSync } from 'child_process';
import { homedir } from 'os';

interface optionsObject {
	/**
	 * Autogenerated value 
	 *
	 * @type {number}
	 * @memberof optionsObject
	 */
	marked: number;
}

interface commentInterface {
	/**
	 *Comment text
	 *
	 * @type {string}
	 * @memberof commentObject
	 */
	text: string
	/**
	 *Username 
	 *
	 * @type {string}
	 * @memberof commentObject
	 */
	username: string
	/**
	 *Link of the avatar
	 *
	 * @type {string}
	 * @memberof commentObject
	 */
	avatar: string
}

interface saramObject {
	/**
	 *Auto generated id
	 *
	 * @type {string}
	 * @memberof saramObject
	 */
	id: string;
	/**
	 *Type of output. Valid types are file, stdout, script, dump, tool and image
	 *
	 * @type {string}
	 * @memberof saramObject
	 */
	type: string;
	/**
	 * Output of command
	 *
	 * @type {string}
	 * @memberof saramObject
	 */
	output: string;
	/**
	 * Command to run
	 *
	 * @type {string}
	 * @memberof saramObject
	 */
	command: string;
	/**
	 * Username. Sets from `.saram.conf` file
	 *
	 * @type {string}
	 * @memberof saramObject
	 */
	user: string;
	/**
	 *The comments object. Object includes username, text and avatar
	 *
	 * @type {Array<commentInterface>}
	 * @memberof saramObject
	 */
	comment: Array<commentInterface>;
	/**
	 * Options object
	 *
	 * @type {optionsObject}
	 * @memberof saramObject
	 */
	options: optionsObject;
	/**
	 * The time string. use `new Date().toUTCString()`
	 *
	 * @type {string}
	 * @memberof saramObject
	 */
	time: string;
}

interface init {
	/**
	 * Token of the entry to work with
	 *
	 * @type {string}
	 * @memberof init
	 */
	token: string;
	/**
	 * Set local to `true` to use localhost:5001 as host
	 *
	 * @type {boolean}
	 * @memberof init
	 */
	local?: boolean;
	/**
	 * Optionally set a different baseUrl other than localhost or saram.securisecctf
	 *
	 * @type {string}
	 * @memberof init
	 */
	baseUrl?: string;
}

interface methodTypes {
	/**
	 * Optional comment string
	 *
	 * @type {string}
	 * @memberof methodTypes
	 */
	comment?: string;
	/**
	 * Optional script name
	 *
	 * @type {string}
	 * @memberof methodTypes
	 */
	scriptName?: string;
}

/**
 * The main class for Saram. token and user values are required.
 */
class Saram {
	private token: string;
	private local?: boolean;
	avatar: string;
	key: string;
	user: string;
	configPath: string;
	baseUrl?: string;
	url: string;
	saramObject: saramObject;

	/**
	 *Creates an instance of Saram.
	 * @param {init} options
	 * @memberof Saram
	 */
	constructor (options: init) {
		this.token = options.token;
		this.user = '';
		this.key = '';
		this.avatar = '';
		this.local = options.local || false;
		this.baseUrl = options.baseUrl;
		this.url = `${this.checkDev()}api/${this.token}`;
		this.configPath = `${homedir()}/.saram.conf`;
		this.checkDev();
		this.readConfig();
		this.saramObject = {
			id: uuid(),
			user: this.user,
			type: '',
			output: '',
			command: '',
			comment: [{
				text: 'saramJs',
				username: this.user,
				avatar: this.avatar
			}],
			options: {
				marked: 2
			},
			time: new Date().toUTCString()
		};
	}

	/**
	 * Reads the sets various values from the local Saram conf file
	 */
	private readConfig = () => {
		try {
			let c = JSON.parse(
				readFileSync(this.configPath, {
					encoding: 'utf8'
				})
			);
			this.key = c.apiKey;
			this.user = c.username;
			this.avatar = c.avatar || '/static/saramjs.png'
		} catch (error) {}
	};

	private checkDev = (): void => {
		let getUrl = (url: string): void => {
			this.baseUrl = url;
			this.url = `${url}api/${this.token}`;
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
	private cleanOutput = (s: string): string => {
		return s.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').trim();
	};

	/**
	 * Reads the contents of the whole script this method is called 
	 * in and makes it available to send to the Saram server
	 *
	 * @param {methodTypes} [params={}]
	 * @returns {Saram}
	 */
	readScriptSelf = (params: methodTypes = {}): Saram => {
		let scriptPath = process.argv[1];
		let output = readFileSync(scriptPath, {
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
	readFileContent = (filePath: string, params: methodTypes = {}): Saram => {
		let output = readFileSync(filePath, {
			encoding: 'utf8'
		});
		this.saramObject.command = basename(filePath);
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
	variableOutput = (variable: any, params: methodTypes = {}): Saram => {
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
	runCommand = (command: string, params: methodTypes = {}): Saram => {
		let stdout = execSync(command).toString();
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
	sendToServer = (): void => {
		Axios({
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
	send = this.sendToServer;
}

/**
 * This class is intended to create the local `.saram.conf` file 
 * which all Saram extentions/modules etc relies on.
 */
class SaramInit extends Saram {
	private apiKey: string;

	/**
	 *Creates an instance of SaramInit.
	 * @param {string} apiKey
	 * @param {boolean} [local] Set to true to use http://localhost:5001/
	 * @param {string} [baseUrl] Set an arbitrary base url. Make sure to end with `/`
	 * @memberof SaramInit
	 */
	constructor (apiKey: string, local?: boolean, baseUrl?: string) {
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
	 *
	 * @memberof SaramInit
	 */
	init (): void {
		Axios.post(`${this.url}misc/valid/key`, {
			key: this.apiKey
		})
			.then((res) => {
				writeFileSync(this.configPath, JSON.stringify(res.data), {
					encoding: 'utf8'
				});
				console.log(`Created ${this.configPath}`);
			})
			.catch((error) => console.log('API key is not valid'));
	}
}

interface CreateNewSection {
	/**
	 *The token for the entry. Each entry has a unique token
	 *
	 * @type {string}
	 * @memberof CreateNewSection
	 */
	token: string;
	/**
	 * What type of output is it? Valid types are 
	 * file, script, dump, stdout, tool and image
	 *
	 * @type {string}
	 * @memberof CreateNewSection
	 */
	type: string;
	/**
	 * The output that a command generates. This could 
	 * also be the content of a script or file
	 *
	 * @type {string}
	 * @memberof CreateNewSection
	 */
	output: string;
	/**
	 * The command that was run. This could also be a file name
	 *
	 * @type {string}
	 * @memberof CreateNewSection
	 */
	command: string;
	/**
	 * Comment to add. Optional
	 *
	 * @type {Array<string>}
	 * @memberof CreateNewSection
	 */
	comment?: Array<commentInterface>;
}

/**
 * This class makes the whole API for Saram available. 
 */
class SaramAPI extends Saram {
	private headers: object;
	private request: AxiosInstance;
	private apiUrl: string;
	private validTypes: Array<string>;
	private validCategories: Array<string>;

	/**
	 *Creates an instance of SaramAPI.
	 * @param {boolean} [local] Set to true to use http://localhost:5001/
	 * @param {string} [baseUrl] Set an arbitrary base url. Make sure to end with `/`
	 * @memberof SaramAPI
	 */
	constructor (local?: boolean, baseUrl?: string) {
		super({
			token: '',
			local: local || false,
			baseUrl: baseUrl || ''
		});
		this.headers = {
			'x-saram-apikey': this.key,
			'x-saram-username': this.user
		};
		this.apiUrl = `${this.url}`;
		this.request = Axios.create({
			headers: this.headers,
			baseURL: this.apiUrl
		});
		this.validTypes = [ 'file', 'stdout', 'script', 'dump', 'tool', 'image' ];
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

	/**
	 * Private method that generates a valid token
	 */
	private _generateToken = (title: string) => {
		var u = uuid().slice(0, 8);
		var t = title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').join('-').slice(0, 25);
		return `${u}-${t}`;
	};

	/**
	 * Gets an array of all the valid entries
	 *
	 * @returns {AxiosPromise} An Axios promise
	 */
	getAllEntries = (): AxiosPromise => {
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
	getEntry = (token: string): AxiosPromise => {
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
	deleteEntry = (token: string): AxiosPromise => {
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
	createNewSection = (data: CreateNewSection): AxiosPromise => {
		if (!this.validTypes.includes(data.type)) {
			throw new Error(`Invalid type. Valid types are ${this.validTypes}`);
		}
		let payload: object = {
			id: uuid(),
			type: data.type,
			output: data.output,
			command: data.command,
			user: this.user,
			comment: [{
				text: data.comment,
				username: this.user,
				avatar: this.avatar
			}],
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
	addComment = (token: string, dataid: string, comment: string): AxiosPromise => {
		return this.request({
			method: 'patch',
			url: `${token}/${dataid}/comment`,
			data: { data: {
				text: comment,
				username: this.user,
				avatar: this.avatar
			} }
		});
	};

	/**
	 * Delete a section. This will delete a single section in an entry
	 *
	 * @param {string} token A valid toekn for the entry
	 * @param {string} dataid The dataid of the section to delete
	 * @returns {AxiosPromise} An Axios promise
	 */
	deleteSection = (token: string, dataid: string): AxiosPromise => {
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
	createNewEntry = (title: string, category: string, slackLink?: string): AxiosPromise => {
		if (!this.validCategories.includes(category)) {
			throw new Error(`Not a valid category. Valid categories are ${this.validCategories}`);
		}
		let newToken: string = this._generateToken(title);
		let payload: object = {
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
	resetApiKey = (oldApiKey: string, username: string): AxiosPromise => {
		let payload: object = {
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
	changeUserName = (apiKey: string, oldUserName: string, newUserName: string): AxiosPromise => {
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
	validateApiKey = (apiKey: string): AxiosPromise => {
		return Axios({
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
	getValidToken = (title: string): string => {
		return this._generateToken(title);
	};
}

export { Saram, SaramInit, SaramAPI };
