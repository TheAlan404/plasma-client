/* Plasma Client */
const { EventEmitter } = require("events");
const { Proxy } = require("./proxy.js");
const { version } = require("./build.json");
const { ConfigTypeMap } = require("./utils/constants.js");

const SimpleDB = require("./classes/SimpleDB.js");
const ConfigHelper = require("./classes/ConfigHelper.js");

const createServer = require("./utils/server.js");
const sendLogin = require("./utils/login.js");
const clientBootstrap = require("./utils/clientBootstrap.js");
const mainMenu = require("./utils/MainMenu.js");
const consoleChat = require("./utils/consoleChat.js");

module.exports = class PlasmaClient extends EventEmitter {
	constructor(port){
		super();
		this.version = version;
		this.db = new SimpleDB("./userdb.json");
		this.config = new ConfigHelper(this.db._data, ConfigTypeMap);
		this.config.save = () => {
			this.db.set("config", this.config.data);
			this.db.save();
		};
		
		this.server = createServer(this, port);
		this.proxy = new Proxy(this);
		
		if(process.argv.includes("-con") || process.argv.includes("--console")) consoleChat(plasma);
	};
	handleError(err){
		console.log(chalk.brightRed(err.toString()));
	};
	handleLogin(client){
		clientBootstrap(this, client);
		sendLogin(this, client);
		if(this.proxy.canRebind) {
			this.proxy.bind(client);
		} else {
			mainMenu.init(this, client);
		};
	};
	write(name, data){
		for(let i in this.server.clients){
			try {
				this.server.clients[i].write(name, data);
			} catch(e){
				this.handleError(e);
			};
		};
	};
};
