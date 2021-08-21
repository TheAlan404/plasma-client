/* Plasma Client | (UI) MainMenu */
const { TextMenu, ButtonRow, ButtonList } = require("../classes/TextMenu.js");
const ChatListener = require("../classes/ChatListener.js");
const Msg = require("@Msg");
const { validateNick } = require("../utils/utils.js");
const { server_list, direct_connect } = require("../utils/localserverlist.js")();
const { pendingUpdate, newVersion } = require("../updater.js");

// the worst code ive ever written idk

const menuPrefix = "@";

const P = new Msg("[P] ", "dark_aqua");
const MEDAL_INFO = [
	new Msg("(", "green"),
	new Msg("i", "green"),
	new Msg(") ", "green"),
];
const MEDAL_ALERT = [
	new Msg("(", "dark_red"),
	new Msg("!", "red"),
	new Msg(") ", "dark_red"),
];
const PAD = "\n     ";

const mainMenuCommands = {
	REFRESH: (plasma, client) => {
		init(plasma, client, () => client.chat(new Msg("> Server list refreshed", "gray")));
		return true;
	},
	INSTALLUPDATE: (plasma, client) => {
		
	},
	NICK: async (plasma, client) => {
		client.chat([...MEDAL_INFO, new Msg("Enter nick:", "gray")]);
		let notExit = true;
		while(notExit){
			let nick = await ChatListener.prompt(client);
			if(nick == "cancel") {
				init(plasma, client, () => client.chat(new Msg("> Change nick cancelled", "gray")));
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
				client.chat([...MEDAL_ALERT, new Msg("Invalid nick, try again (type 'cancel' to cancel, 'reset' to reset):")]);
			};
		};
		return true;
	},
	PREFIX: (plasma, client) => {},
	CONFIG: (plasma, client) => {},
	OWO: (plasma, client) => client.chat(new Msg("~ UwU ~", "dark_aqua")),
	LIST: (plasma, client) => {
		client.chat([
			new Msg(" (i) ", "green"),
			new Msg("Available main menu commands:", "gray"),
			new Msg(Object.keys(mainMenuCommands).map(cmd => `${PAD}${menuPrefix}${cmd}`).join(""), "white"),
		]);
	},
	EXIT: async (plasma, client) => {
		client.chat([...MEDAL_ALERT, new Msg("Are you sure you want to exit? [y/n]", "gray")]);
		let answer = await ChatListener.prompt(client);
		let yes = answer[0].toLowerCase() === "y";
		if(yes) process.exit();
		init(plasma, client);
		return true;
	},
};

function init(plasma, client, cb = () => null){
	let div = "-".repeat(15);
	
	let midText = [
		(pendingUpdate ? [
			...MEDAL_INFO,
			new Msg("Pending update: ", "gray"),
			new Msg(newVersion, "gold"),
			new Msg(" [UPDATE] ", "aqua",
				new Msg("Click to install the update"),
			"#INSTALLUPDATE"),
		] : null),
		(plasma.proxy.nick && plasma.proxy.nick.length ? [
			...MEDAL_INFO,
			new Msg("You are currently nicked as ", "gray"),
			new Msg(plasma.proxy.nick, "gold"),
		] : null),
	];
	
	let ServerList = removeCurrent(plasma, server_list);
	
	let main = new TextMenu({
		header: [new Msg(div+"/"), new Msg("Plasma Client", "dark_aqua"), new Msg("\\"+div, "white"), "\n"],
		footer: ["\n", new Msg(div+"\\"), new Msg("Select Server", "gold"), new Msg("/"+div, "white")],
		contents: [
			new ButtonList(ServerList.map(({ name, ip }, idx) => 
				new Msg(ip, "aqua", [
					new Msg("Connect to ", "white"),
					new Msg('"'+name+'"', "aqua"),
					new Msg("\nIP: ", "gold"), new Msg(ip, "white")
				], ip)
			), {
				border: (plasma.consoleMode ? [`${idx + 1} > [`, "]"] : ["> [", "]"]),
			}),
			" ",
			((direct_connect.length && direct_connect != plasma.localIP) ? [
				new Msg("- [direct connect]\n", "green", [
					new Msg("Connect to the last direct connect IP:", "white"),
					new Msg("\n"),
					new Msg(direct_connect, "gold")
				], direct_connect)
			] : null),
			
			new Msg("> You can also type the IP address into the chat", "gray"),
			" ",
			
			...midText,
			(midText.filter(_ => _).length ? " " : null),
			
			// TODO: Make this customizeable etc
			new ButtonRow([
				new Msg("Refresh", "gold", 
					new Msg("Refreshes the server list\nIf no server is listed click this button.", "gray"),
				`${menuPrefix}REFRESH`),
				new Msg("Change Nick", "blue",
					new Msg("Changes nick", "gray"),
				`${menuPrefix}NICK`),
				new Msg("Set Prefix", "purple",
					new Msg("Changes the command prefix.\Will be changed via a config command in the future.", "gray"),
				`${menuPrefix}PREFIX`),
				new Msg("Settings", "gray",
					new Msg("Configure general settings for Plasma", "gray"),
				`${menuPrefix}CONFIG`),
			]),
			(plasma.consoleMode ? [
			    new Msg(" (i) ", "green"),
			    new Msg("Console mode is on.", "gray"),
				PAD, new Msg("Type the IP address to connect.", "gray"),
				PAD, new Msg("Type '", "gray"),
				new Msg("@LIST", "white"),
				new Msg("' for main menu commands", "gray"),
			] : null),
		],
	});
	main.send(client);
	let getInput = async () => {
	    let message = await ChatListener.prompt(client);
		if(message[0] === ".") return;
	    if(message.startsWith(menuPrefix)) {
	        let cmd = message.split(" ")[0].slice(1).toUpperCase();
	        if(!mainMenuCommands[cmd]) {
	            return;
	        };
	        let stop = mainMenuCommands[cmd](plasma, client, message.split(" ").slice(1));
	        if(!stop && !(stop instanceof Promise)) getInput();
	    } else {
			if(!isNaN(message)) {
				if(!ServerList[message - 1]) {
					client.chat([...MEDAL_ALERT, new Msg(`No server with number ${message}`, "gray")]);
					return getInput();
				};
				message = ServerList[message - 1].ip;
			};
			let h = message.split(":")[0];
			let p = message.split(":")[1] ?? 25565;
			client.chat([P, new Msg(`Connecting to '${h}${p === 25565 ? "" : `:${p}`}'${!plasma.proxy.nick ? "" : ` with username '${plasma.proxy.nick}'`}...`, "gray")]);
	        plasma.proxy.connect(client, {
	            host: h,
	            port: p,
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
