import Axios from 'axios';
import uuid from 'uuid/v1';
import { readFileSync } from 'fs';
import { basename } from 'path';
import { execSync } from 'child_process';

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
	user: string;
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
	private user: string;
	private local?: boolean;
	private baseUrl?: string;
	private url: string;
	saramObject: saramObject;

	constructor (options: init) {
		this.token = options.token;
		this.user = options.user;
		this.local = options.local || false;
		this.baseUrl = options.baseUrl;
		this.url = `${this.checkDev()}${this.token}`;
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
		this.checkDev();
	}

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

	private cleanOutput = (s: string): string => {
		return s.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').trim();
	};

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
   * Gets all the current entries from the Saram server
   */
	getAllEntries = () => {
		return Axios({
			method: 'get',
			baseURL: this.baseUrl,
			url: 'api/all/4df9cc121afe1c00de4e9e396af4cdb1'
		});
	};

	/**
   * Sends the value of saramObject to the Saram server
   */
	sendToServer = (): void => {
		Axios({
			method: 'patch',
			url: this.url,
			data: this.saramObject
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

export { Saram };
