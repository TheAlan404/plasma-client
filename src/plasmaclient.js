/* Plasma Client */
const { EventEmitter } = require("events");
const chalk = require("chalk");

require("module-alias/register");
const { Proxy, ProxyFilter } = require("@Proxy");
const { version } = require("./build.json");
const { ConfigTypeMap } = require("./utils/constants.js");
const SimpleDB = require("./classes/SimpleDB.js");
const ConfigHelper = require("./classes/ConfigHelper.js");
const { CommandHandler } = require("@Commands");
const { ChatButtonHandler } = require("@ChatButtons");
const { MapManager } = require("@Components/MapManager");

const createServer = require("./utils/server.js");
const sendLogin = require("./utils/login.js");
const clientBootstrap = require("./utils/clientBootstrap.js");
const mainMenu = require("./UI/MainMenu.js");
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
		
		createServer(this, port);
		this.proxy = new Proxy(this);
		this.cmdHandler = new CommandHandler(this);
		this.chatButtons = new ChatButtonHandler(this);
		this.maps = new MapManager(this);
		
		if(process.argv.includes("-con") || process.argv.includes("--console")) consoleChat(this);
	};
	handleError(err){
		console.log(chalk.red(err.toString()));
		console.log(err.stack);
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
	chat(comp){
		for(let i in this.server.clients){
			try {
				this.server.clients[i].chat(comp);
			} catch(e){
				this.handleError(e);
			};
		};
	};
	get client(){
		return this.server.getFirstClient();
	};
};
