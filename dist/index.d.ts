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
declare class Saram {
    private token;
    private user;
    private local?;
    private key;
    configPath: string;
    baseUrl?: string;
    url: string;
    saramObject: saramObject;
    constructor(options: init);
    private readConfig;
    private checkDev;
    private cleanOutput;
    readScriptSelf: (params?: methodTypes) => Saram;
    /**
   * Method that returns the whole file of the file it is called in.
   */
    readFileContent: (filePath: string, params?: methodTypes) => Saram;
    /**
   * Function will send the variable of a JS/TS file to the server
   */
    variableOutput: (variable: any, params?: methodTypes) => Saram;
    /**
   * Send the output of a command line command to the server
   */
    runCommand: (command: string, params?: methodTypes) => Saram;
    /**
   * Sends the value of saramObject to the Saram server
   */
    sendToServer: () => void;
    /**
   * Alias for sendToServer
   */
    send: () => void;
}
declare class SaramInit extends Saram {
    private apiKey;
    constructor({ apiKey, local, baseUrl }: {
        apiKey: string;
        local?: boolean;
        baseUrl?: string;
    });
    init(): void;
}
export { Saram, SaramInit };
