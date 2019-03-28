import { AxiosPromise } from 'axios';
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
    private local?;
    key: string;
    user: string;
    configPath: string;
    baseUrl?: string;
    url: string;
    saramObject: saramObject;
    constructor(options: init);
    /**
     * Reads the sets various values from the local Saram conf file
     */
    private readConfig;
    private checkDev;
    /**
     * Strips out ansii color escape codes from stdout
     */
    private cleanOutput;
    /**
     * Reads the contents of the whole script this method is called
     * in and makes it available to send to the Saram server
     */
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
/**
 * This class is intended to create the local `.saram.conf` file
 * which all Saram extentions/modules etc relies on.
 */
declare class SaramInit extends Saram {
    private apiKey;
    constructor({ apiKey, local, baseUrl }: {
        apiKey: string;
        local?: boolean;
        baseUrl?: string;
    });
    /**
     * The init method will create a `.saram.conf` file in the users
     * home directory using a valid API key and username.
     */
    init(): void;
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
declare class SaramAPI extends Saram {
    private headers;
    private request;
    private apiUrl;
    private validTypes;
    private validCategories;
    constructor({ local, baseUrl }: {
        local?: boolean;
        baseUrl?: string;
    });
    /**
     * Private method that generates a valid token
     */
    private _generateToken;
    /**
     * Gets an array of all the valid entries
     */
    getAllEntries: () => AxiosPromise<any>;
    /**
     * Gets all the data associated with a single entry
     */
    getEntry: (token: string) => AxiosPromise<any>;
    /**
     * Delete an entry entirely
     */
    deleteEntry: (token: string) => AxiosPromise<any>;
    /**
     * Create a new section. This will add to the existing entry.
     */
    createNewSection: (data: CreateNewSection) => AxiosPromise<any>;
    /**
     * Add a comment to an existing section
     */
    addComment: ({ token, dataid, comment }: {
        token: string;
        dataid: string;
        comment: string;
    }) => AxiosPromise<any>;
    /**
     * Delete a section. This will delete a single section in an entry
     */
    deleteSection: ({ token, dataid }: {
        token: string;
        dataid: string;
    }) => AxiosPromise<any>;
    /**
     * Create a new entry. This is a whole new entry to work with
     */
    createNewEntry: ({ title, category, slackLink }: {
        title: string;
        category: string;
        slackLink?: string | undefined;
    }) => AxiosPromise<any>;
    /**
     * Reset the API key
     */
    resetApiKey: ({ oldApiKey, username }: {
        oldApiKey: string;
        username: string;
    }) => AxiosPromise<any>;
    /**
     * Changes the username. Accepts a valid API key, a valid
     * current username and the new username. Returns a new username
     */
    changeUserName: ({ apiKey, oldUserName, newUserName }: {
        apiKey: string;
        oldUserName: string;
        newUserName: string;
    }) => AxiosPromise<any>;
    /**
     * Validates an API key, and returns the key and associated
     * username on success.
     */
    validateApiKey: (apiKey: string) => AxiosPromise<any>;
    /**
     * Generate a valid token
     */
    getValidToken: (title: string) => string;
}
export { Saram, SaramInit, SaramAPI };
