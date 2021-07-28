/* Plasma Client | (UI) MainMenu */
const { TextMenu, ButtonRow, ButtonList } = require("../classes/TextMenu.js");
const ChatListener = require("../classes/ChatListener.js");
const Msg = require("../classes/Msg.js");
const { validateNick } = require("../utils/utils.js");
const { server_list, direct_connect } = require("../utils/localserverlist.js")();
const { pendingUpdate, newVersion } = require("../updater.js");

// the worst code ive ever written idk

const menus = {
	main: (plasma, client, ctx) => {
		
	},
};

const mainMenuCommands = {
	REFRESH: (plasma, client) => {
		init(plasma, client, () => client.chat(new Msg("> Server list refreshed", "gray")));
		return true;
	},
	INSTALLUPDATE: (plasma, client) => {
		
	},
	NICK: async (plasma, client) => {
		let notExit = true;
		while(notExit){
			let nick = await ChatListener.prompt(client);
			if(nick == "cancel") {
				init(plasma, client, () => client.chat(new Msg("> Cancelled", "gray")));
				return true;
			};
			if(nick == "reset" || nick === client.username) {
				plasma.proxy.setNick("");
				init(plasma, client, () => client.chat(new Msg("> Nick has been reset", "gray")));
				return true;
			};
				
			let valid = validateNick(nick);
			if(valid) {
				plasma.proxy.setNick(nick);
				init(plasma, client, () => client.chat(new Msg("> Nick has been set", "gray")));
				return true;
			} else {
				client.chat([new Msg(" (!) ", "red"), new Msg("Invalid nick, try again (type 'cancel' to cancel, 'reset' to reset):")]);
			};
		};
		return true;
	},
	PREFIX: (plasma, client) => {},
	CONFIG: (plasma, client) => {},
	OWO: (plasma, client) => client.chat(new Msg("~ UwU ~", "dark_aqua")),
};

function init(plasma, client, cb = () => null){
	let div = "-".repeat(15);
	let main = new TextMenu({
		header: [new Msg(div+"/"), new Msg("Plasma Client", "dark_aqua"), new Msg("\\"+div, "white"), "\n"],
		footer: ["\n", new Msg(div+"\\"), new Msg("Select Server", "gold"), new Msg("/"+div, "white")],
		contents: [
			new ButtonList([...removeCurrent(plasma, server_list).map(({ name, ip }) => 
				new Msg(ip, "aqua", [
					new Msg("Connect to ", "white"),
					new Msg('"'+name+'"', "aqua"),
					new Msg("\nIP: ", "gold"), new Msg(ip, "white")
				], ip)
			)]),
			...((direct_connect.length && direct_connect != plasma.localIP) ? [
				new Msg("- [direct connect]\n", "green", [
					new Msg("Connect to the last direct connect IP:", "white"),
					new Msg("\n"),
					new Msg(direct_connect, "gold")
				], direct_connect)
			] : []),
			...(pendingUpdate ? [
				new Msg(" (i) ", "green"),
				new Msg("Pending update: ", "gray"),
				new Msg(newVersion, "gold"),
				new Msg(" [UPDATE] ", "aqua",
					new Msg("Click to install the update"),
				"#INSTALLUPDATE"),
			] : []),
			...(plasma.proxy.nick && plasma.proxy.nick.length ? [
				new Msg(" (i) ", "green"),
				new Msg("You are currently nicked as ", "gray"),
				new Msg(plasma.proxy.nick, "gold"),
			] : []),
			// TODO: Make this customizeable etc
			new ButtonRow([
				new Msg("Refresh", "gold", 
					new Msg("Refreshes the server list\nIf no server is listed click this button.", "gray"),
				"#REFRESH"),
				new Msg("Change Nick", "blue",
					new Msg("Changes nick", "gray"),
				"#NICK"),
				new Msg("Set Prefix", "purple",
					new Msg("Changes the command prefix.\Will be changed via a config command in the future.", "gray"),
				"#PREFIX"),
				new Msg("Settings", "gray",
					new Msg("Configure general settings for Plasma", "gray"),
				"#CONFIG"),
			]),
			...(plasma.consoleMode ? [
			    new Msg(" (i) ", "green"),
			    new Msg("Console mode is on. Type the IP address to connect. Use '#' to access main menu buttons", "gray"),
			] : []),
		],
	});
	main.send(client);
	let getInput = async () => {
	    let message = await ChatListener.prompt(client);
	    if(message.startsWith("#")) {
	        let cmd = message.split(" ")[0].slice(1).toUpperCase();
	        if(!mainMenuCommands[cmd]) {
	            return;
	        };
	        let stop = mainMenuCommands[cmd](plasma, client);
	        if(!stop && !(stop instanceof Promise)) getInput();
	    } else {
	        plasma.proxy.connect(client, {
	            host: message.split(":")[0],
	            port: message.split(":")[1] ?? 25565,
	        });
	    };
	};
	// TODO: Attach chat message listener
	// TODO: Api for chat menus
	// TODO: init proxy
	// TODO: config menu
	cb();
	getInput();
};

function removeCurrent(plasma, server_list){
	let tmp = [];
	for(let indx in server_list){
		let { ip } = server_list[indx];
		if(ip == plasma.localIP) continue;
		tmp.push(server_list[indx]);
	};
	return tmp;
};

module.exports = {
	init,
	mainMenuCommands,
};
