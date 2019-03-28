import Axios, { AxiosInstance, AxiosResponse, AxiosPromise } from 'axios';
import uuid from 'uuid/v1';
import { readFileSync, writeFileSync } from 'fs';
import { basename } from 'path';
import { execSync } from 'child_process';
import { homedir } from 'os';

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

interface init {
	token: string;
	local?: boolean;
	baseUrl?: string;
}

interface methodTypes {
	comment?: string;
	scriptName?: string;
	[key: string]: any;
}

/**
 * The main class for Saram. token and user values are required.
 */
class Saram {
	private token: string;
	private local?: boolean;
	key: string;
	user: string;
	configPath: string;
	baseUrl?: string;
	url: string;
	saramObject: saramObject;

	constructor (options: init) {
		this.token = options.token;
		this.user = '';
		this.key = '';
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
			comment: [ 'SaramJs' ],
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
		} catch (error) {}
	};

	private checkDev = (): void => {
		let getUrl = (url: string): void => {
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
	private cleanOutput = (s: string): string => {
		return s.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').trim();
	};

	/**
	 * Reads the contents of the whole script this method is called 
	 * in and makes it available to send to the Saram server
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
			this.saramObject.comment.push(params.comment);
		}
		console.log(output);
		return this;
	};

	/**
   * Method that returns the whole file of the file it is called in.
   */
	readFileContent = (filePath: string, params: methodTypes = {}): Saram => {
		let output = readFileSync(filePath, {
			encoding: 'utf8'
		});
		this.saramObject.command = basename(filePath);
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
	variableOutput = (variable: any, params: methodTypes = {}): Saram => {
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
	runCommand = (command: string, params: methodTypes = {}): Saram => {
		let stdout = execSync(command).toString();
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
   */
	send = this.sendToServer;
}

/**
 * This class is intended to create the local `.saram.conf` file 
 * which all Saram extentions/modules etc relies on.
 */
class SaramInit extends Saram {
	private apiKey: string;

	constructor ({ apiKey, local, baseUrl }: { apiKey: string; local?: boolean; baseUrl?: string }) {
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
	token: string;
	type: string;
	output: string;
	command: string;
	comment?: [];
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

	constructor ({ local, baseUrl }: { local?: boolean; baseUrl?: string }) {
		super({
			token: '',
			local: local || false,
			baseUrl: baseUrl || ''
		});
		this.headers = {
			'x-saram-apikey': this.key,
			'x-saram-username': this.user
		};
		this.apiUrl = `${this.url}api/`;
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
	 */
	getAllEntries = (): AxiosPromise => {
		return this.request({
			method: 'get',
			url: '/all/entries'
		});
	};

	/**
	 * Gets all the data associated with a single entry
	 */
	getEntry = (token: string): AxiosPromise => {
		return this.request({
			method: 'get',
			url: token
		});
	};

	/**
	 * Delete an entry entirely
	 */
	deleteEntry = (token: string): AxiosPromise => {
		return this.request({
			method: 'delete',
			url: token
		});
	};

	/**
	 * Create a new section. This will add to the existing entry.
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
			comment: data.comment || [ 'saramJs' ],
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
	addComment = ({ token, dataid, comment }: { token: string; dataid: string; comment: string }): AxiosPromise => {
		return this.request({
			method: 'patch',
			url: `${token}/${dataid}/comment`,
			data: { data: comment }
		});
	};

	/**
	 * Delete a section. This will delete a single section in an entry
	 */
	deleteSection = ({ token, dataid }: { token: string; dataid: string }): AxiosPromise => {
		return this.request({
			method: 'delete',
			url: `${token}/${dataid}`
		});
	};

	/**
	 * Create a new entry. This is a whole new entry to work with
	 */
	createNewEntry = ({
		title,
		category,
		slackLink
	}: {
		title: string;
		category: string;
		slackLink?: string;
	}): AxiosPromise => {
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
	 */
	resetApiKey = ({ oldApiKey, username }: { oldApiKey: string; username: string }): AxiosPromise => {
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
	 */
	changeUserName = ({
		apiKey,
		oldUserName,
		newUserName
	}: {
		apiKey: string;
		oldUserName: string;
		newUserName: string;
	}): AxiosPromise => {
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
	validateApiKey = (apiKey: string): AxiosPromise => {
		return Axios({
			method: 'post',
			url: `${this.baseUrl}misc/valid/key`,
			data: { key: apiKey }
		});
	};

	/**
	 * Generate a valid token
	 */
	getValidToken = (title: string): string => {
		return this._generateToken(title);
	};
}

export { Saram, SaramInit, SaramAPI };
