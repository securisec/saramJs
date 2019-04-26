interface commentInterface {
    /**
     *Comment text
     *
     * @type {string}
     * @memberof commentObject
     */
    text: string;
    /**
     *Username
     *
     * @type {string}
     * @memberof commentObject
     */
    username: string;
    /**
     *Link of the avatar
     *
     * @type {string}
     * @memberof commentObject
     */
    avatar: string;
}
interface saramObject {
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
 * If the .saram.conf file is not found in the home directory, it
 * will throw an error.
 */
declare class Saram {
    private token;
    avatar: string;
    key: string;
    user: string;
    configPath: string;
    baseUrl: string;
    url: string;
    saramObject: saramObject;
    /**
     * Token of the entry to work with
     *
     * @type {string}
     * @memberof init
     */
    constructor(token: string);
    /**
     * Strips out ansii color escape codes from stdout
     */
    private cleanOutput;
    /**
     * Reads the contents of the whole script this method is called
     * in and makes it available to send to the Saram server
     *
     * @param {methodTypes} [params={}]
     * @returns {Saram}
     */
    readScriptSelf: (params?: methodTypes) => Saram;
    /**
     * Method that returns the whole file of the file it is called in.
     *
     * @param {string} filePath A valid file path to read. Will not work with binary files
     * @param {methodTypes} [params={}] Optionally set a comment with `comment` param
     * @returns {Saram}
     */
    readFileContent: (filePath: string, params?: methodTypes) => Saram;
    /**
     * Function will send the variable of a JS/TS file to the server
     *
     * @param {*} variable The output from any script variable
     * @param {methodTypes} [params={}] Optionally set a comment with `comment` param
     * @returns {Saram}
     */
    variableOutput: (variable: any, params?: methodTypes) => Saram;
    /**
     * Send the output of a command line command to the server
     *
     * @param {string} command The command to run
     * @param {methodTypes} [params={}] Optionally set a comment with `comment` param
     * @returns {Saram}
     */
    runCommand: (command: string, params?: methodTypes) => Saram;
    /**
   * Sends the value of saramObject to the Saram server
   */
    sendToServer: () => void;
    /**
   * Alias for sendToServer
     *
     * @memberof Saram
     */
    send: () => void;
}
/**
 * This class is intended to create the local `.saram.conf` file
 * which all Saram extentions/modules etc relies on.
 */
declare class SaramInit {
    private apiKey;
    private local?;
    private base_url?;
    private configPath;
    /**
     *Creates an instance of SaramInit.
     * @param {string} apiKey a valid api key
     * @param {boolean} [local] set to true to use localhost as base url
     * @param {string} [base_url] set the base url. Otherwise the default Saram url is used
     */
    constructor({ apiKey, local, base_url }: {
        apiKey: string;
        local?: boolean;
        base_url?: string;
    });
    /**
     * The init method will create a `.saram.conf` file in the users
     * home directory using a valid API key and username.
     *
     * @memberof SaramInit
     */
    init(): void;
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
    type: 'file' | 'stdout' | 'script' | 'dump' | 'tool' | 'image';
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
declare class SaramAPI extends Saram {
    private headers;
    private request;
    private apiUrl;
    /**
     *Creates an instance of SaramAPI.
     * @memberof SaramAPI
     */
    constructor();
    /**
     * Private method that generates a valid token
     */
    private _generateToken;
    /**
     *Gets an array of all the valid entries
     *
     * @returns {Promise<object>} A promise with the results
     */
    getAllEntries: () => Promise<object>;
    /**
     * Gets all the data associated with a single entry
     *
     * @param {string} token A valid entry token
     * @returns {Promise<object>} A promise with the results
     */
    getEntry: (token: string) => Promise<object>;
    /**
     * Delete an entry entirely
     *
     * @param {string} token A valid entry token
     * @returns {Promise<object>} A promise with the results
     */
    deleteEntry: (token: string) => Promise<object>;
    /**
     *Update an existing entry.
     *
     * @memberof SaramAPI
     */
    updateEntry: ({ token, description, priority }: {
        /**
         *Valid entry token
         *
         * @type {string}
         */
        token: string;
        /**
         *Optional description for the enrty
         *
         * @type {string}
         */
        description?: string | undefined;
        /**
         *The priorty or risk of the entry. Is used to signify completion also
         *
         * @type {('info' | 'high' | 'medium' | 'low' | 'critical' | 'complete' | 'none')}
         */
        priority?: "info" | "high" | "medium" | "low" | "critical" | "complete" | "none" | undefined;
    }) => Promise<object>;
    /**
     *
     * Create a new section. This will add to the existing entry.
     *
     * @param {CreateNewSection} data
     * @returns {Promise<object>} A promise with the results
     */
    createNewSection: (data: CreateNewSection) => Promise<object>;
    /**
     * Add a comment to an existing section
     *
     * @param {string} token The token for the entry
     * @param {string} dataid The dataid for the section
     * @param {string} comment Comment to add
     * @returns {Promise<object>} A promise with the results
     */
    addComment: (token: string, dataid: string, comment: string) => Promise<object>;
    /**
     * Delete a section. This will delete a single section in an entry
     *
     * @param {string} token A valid toekn for the entry
     * @param {string} dataid The dataid of the section to delete
     * @returns {Promise<object>} A promise with the results
     */
    deleteSection: (token: string, dataid: string) => Promise<object>;
    /**
     * Create a new entry. This is a whole new entry to work with
     *
     * @param {string} title The title of the entry
     * @param {string} category A valid category
     * @returns {Promise<object>} A promise with the results
     */
    createNewEntry: (title: string, category: "none" | "android" | "cryptography" | "firmware" | "forensics" | "hardware" | "ios" | "misc" | "network" | "other" | "pcap" | "pwn" | "reversing" | "scripting" | "stego" | "web") => Promise<object>;
    /**
     * Reset the API key
     *
     * @param {string} oldApiKey The current API key
     * @param {string} username The current username
     * @returns {Promise<object>} A promise with the results
     */
    resetApiKey: (oldApiKey: string, username: string) => Promise<object>;
    /**
     *Reset the password for the user. If the user used a federated
     *identity, they can then use the password to log in locally
     *
     * @param {string} password A valid password string
     * @returns {Promise<object>} A promise with the results
     */
    resetPassword: (password: string) => Promise<object>;
    /**
     * Changes the username. Accepts a valid API key, a valid
     * current username and the new username. Returns a new username
     *
     * @param {string} apiKey A valid API key
     * @param {string} oldUserName The previous username
     * @param {string} newUserName The new username
     * @returns {Promise<object>} A promise with the results
     */
    changeUserName: (apiKey: string, oldUserName: string, newUserName: string) => Promise<object>;
    /**
     *Delete a comment from a section
     *
     * @property {string} token The token for the entry
     * @property {string} dataid The data id for the section
     * @property {string} commentId The id of the comment
     * @returns {Promise<object>} A promise with the results
     */
    deleteComment: ({ token, dataid, commentId }: {
        token: string;
        dataid: string;
        commentId: string;
    }) => Promise<object>;
    /**
     *Get all chat messages associated with an entry
     *
     * @param {string} token A valid entry token
     * @returns {Promise<object>} A promise with an array of objects on resolve
     */
    getAllChat: (token: string) => Promise<object>;
    /**
     *Post a chat message to an entry
     *
     * @property {token} A valid entry token
     * @property {message} A valid chat message
     * @returns {Promise<object>} A promise with the results
     */
    postChatMessage: ({ token, message }: {
        token: string;
        message: string;
    }) => Promise<object>;
    /**
     *Update a chat message in an entry
     *
     * @property {token} A valid entry token
     * @property {message} A valid chat message
     * @property {chatId} A valid existing chat Id
     * @returns {Promise<object>} A promise with the results
     */
    updateChatMessage: ({ token, message, chatId }: {
        token: string;
        message: string;
        chatId: string;
    }) => Promise<object>;
    /**
     *Delete a chat message from an entry
     *
     * @property {token} A valid entry token
     * @property {chatId} A valid chat Id
     * @returns {Promise<object>} A promise with the results
     */
    deleteChatMessage: ({ token, chatId }: {
        token: string;
        chatId: string;
    }) => Promise<object>;
    /**
     *Returns a markdown text response for the specified entry
     *
     * @param {({ token: string; render?: 'true' | 'false' })} { token, render }
     * @returns {Promise<object>}
     */
    getReport: ({ token, render }: {
        token: string;
        render?: "true" | "false" | undefined;
    }) => Promise<object>;
    /**
     * Validates an API key, and returns the key and associated
     * username on success.
     *
     * @param {string} apiKey A valid API key
     * @returns {Promise<object>} A promise with the results
     */
    validateApiKey: (apiKey: string) => Promise<object>;
    /**
     * Generate a valid token. These can be used for testing
     * or for other methods that require a valid token
     *
     * @param {string} title The title of the section/challenge
     * @returns {string} a valid token
     */
    getValidToken: (title: string) => string;
    /**
     *Get an arroy of objects of all the users
     *
     * @returns {Promise<object>}
     */
    adminGetAllUsers: () => Promise<object>;
    /**
     *Get all the information available for a specific user.
     *
     * @param {string} userId A valid user id
     * @returns {Promise<object>}
     */
    adminFindUser: (userId: string) => Promise<object>;
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
    adminCreateUser: (username: string, password: string, isAdmin?: boolean | undefined, avatar?: string | undefined) => Promise<object>;
    /**
     *Delete a user from the database
     *
     * @param {string} userId A valid user id.
     * @returns {Promise<object>} A promise with the results
     */
    adminDeleteUser: (userId: string) => Promise<object>;
    /**
     *Update a users various properties. All properties are optional
     *
     * @param {string} userId A valid user Id
     * @param {{
     * 		profileImage?: string,
     * 		apiKey?: string,
     * 		isAdmin?: boolean,
     * 		isDisabled?: boolean,
     * 		authWith?: string
     * 	}} {
     * 		profileImage=undefined,
     * 		apiKey=undefined,
     * 		isAdmin=undefined,
     * 		isDisabled=undefined,
     * 		authWith=undefined
     * 	}
     * @returns {Promise<object>}
     */
    adminUpdateUser: (userId: string, { profileImage, apiKey, isAdmin, isDisabled, authWith }: {
        _id?: string | undefined;
        profileImage?: string | undefined;
        apiKey?: string | undefined;
        isAdmin?: boolean | undefined;
        isDisabled?: boolean | undefined;
        authWith?: string | undefined;
    }) => Promise<object>;
    /**
     *Get an array of all the API interaction logs
     *
     * @returns {Promise<object>} An array of log objects
     */
    adminGetLogs: () => Promise<object>;
    /**
     *Get an array of objects show the server status
     *
     * @returns {Promise<object>}
     */
    getServerStatus: () => Promise<object>;
}
export { Saram, SaramInit, SaramAPI };
