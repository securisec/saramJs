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

interface saramInit {
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

class Saram {
	private token: string;
	private user: string;
	private local?: boolean;
	private baseUrl?: string;
	private url: string;
	saramObject: saramObject;

	constructor (options: saramInit) {
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
		return this;
	};

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
		return this;
	};

	variableOutput = (variable: any, params: methodTypes = {}): Saram => {
		this.saramObject.command = params.scriptName || 'Script';
		this.saramObject.output = variable;
		this.saramObject.type = 'script';
		if (params.comment) {
			this.saramObject.comment.push(params.comment);
		}
		return this;
	};

	runCommand = (command: string, params: methodTypes = {}): Saram => {
		let stdout = execSync(command).toString();
		this.saramObject.command = command;
		this.saramObject.output = this.cleanOutput(stdout);
		this.saramObject.type = 'stdout';
		if (params.comment) {
			this.saramObject.comment.push(params.comment);
		}
		return this;
	};

	getAllEntries = () => {
		return Axios({
			method: 'get',
			baseURL: this.baseUrl,
			url: 'api/all/4df9cc121afe1c00de4e9e396af4cdb1'
		});
	};

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
  
  send = this.sendToServer
}

// TODO documentation
// TODO convert to installable module