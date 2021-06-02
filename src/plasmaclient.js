/* Plasma Client */
const mc = require("minecraft-protocol");
const { EventEmitter } = require("events");
const { Proxy } = require("./proxy.js");
const { version } = require("./build.json");
const sendLogin = require("./utils/login.js");

module.exports = class PlasmaClient extends EventEmitter {
	constructor(PORT = 25565){
		this.createServer(PORT);
		this.proxy = new Proxy(this);
	};
	handleError(err){
		console.log(chalk.brightRed(err.toString()));
	};
	createServer(port){
		let opts = {
			"online-mode": false,
			version: "1.12.2",
			motd: `Plasma Client\nversion ${version}`,
			port,
		};
		
		this.server = mc.createServer(opts);
		server.on("error", this.handleError.bind(this));
		server.on("login", this.handleLogin.bind(this));
		server.on("listening", () => {
			console.log(chalk.cyan("[Plasma]")+chalk.gray(" Ready! Login to ")+chalk.white("localhost:"+port)+chalk.gray(" to use Plasma."));
		});
	};
	handleLogin(client){
		sendLogin(client);
	};
};