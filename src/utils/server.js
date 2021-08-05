/* Plasma Client | Server Bootstrap */
const mc = require("minecraft-protocol");
const { version } = require("../build.json");
const chalk = require("chalk");

module.exports = (plasma, port) => {
	let opts = {
		"online-mode": false,
		version: "1.12.2",
		motd: `Plasma Client\nversion ${version}`,
		port,
	};
	
	plasma.server = mc.createServer(opts);
	plasma.server.on("error", plasma.handleError.bind(plasma));
	plasma.server.on("login", plasma.handleLogin.bind(plasma));
	let _p = plasma.server.socketServer.address().port;
	plasma.localIP = "localhost" + (_p == 25565 ? "" : ":" + _p);
	plasma.server.on("listening", () => {
		console.log(chalk.cyan("[Plasma]")+chalk.gray(" Ready! Login to ")+chalk.white(plasma.localIP)+chalk.gray(" to use Plasma."));
	});
	plasma.server.getFirstClient = () => {
		return plasma.server.clients[Object.keys(plasma.server.clients)[0]];
	};
};