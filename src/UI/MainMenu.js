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
const PAD = "     ";

const mainMenuCommands = {
	REFRESH: (plasma, client) => {
		init(plasma, client, () => client.chat(new Msg("> Server list refreshed", "gray")));
		return true;
	},
	INSTALLUPDATE: (plasma, client) => {
		
	},
	NICK: async (plasma, client, args) => {
		client.chat([...MEDAL_INFO, new Msg("Enter nick:", "gray")]);
		let notExit = true;
		while(notExit){
			let nick = args[1] || await ChatListener.prompt(client);
			args = [];
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
	SOCKSPROXY: async (plasma, client, args) => {
		client.chat([...MEDAL_INFO, new Msg("Enter socks proxy IP:", "gray")]);
		let info = args[1] || await ChatListener.prompt(client);
		if(info == "cancel") {
			init(plasma, client, () => client.chat(new Msg("> Cancelled", "gray")));
			return true;
		};
		if(info == "reset") {
			plasma.proxy.setSocksProxy(null);
			init(plasma, client, () => client.chat(new Msg("> Socks proxy has been disabled", "gray")));
			return true;
		};
		let v = 5;
		if(info.includes(";")) {
			v = Number(info.split(";")[1]);
			info = info.split(";")[0];
		};
		let host = info.split(":")[0];
		let port = Number(info.split(":")[1]);
		plasma.proxy.setSocksProxy({
			host,
			port,
			v,
		});
		init(plasma, client, () => client.chat([
			new Msg("> Socks proxy has been set to ", "gray"),
			new Msg(`${host}:${port}`, "gold"),
			new Msg((v === 5 ? "" : " with version " + v), "dark_aqua"),
		]));
		return true;
	},
	PREFIX: (plasma, client) => {},
	CONFIG: (plasma, client) => {},
	OWO: (plasma, client) => client.chat(new Msg("~ UwU ~", "dark_aqua")),
	LIST: (plasma, client) => {
		client.chat([
			new Msg(" (i) ", "green"),
			new Msg("Available main menu commands:", "gray"),
		]);
		Object.keys(mainMenuCommands).forEach((cmd) => {
			let str = menuPrefix + cmd;
			let desc = mainMenuCommandDescriptions[cmd];
			client.chat([
				new Msg(PAD, "white"),
				new Msg(str, "white", `Click to run ${str}`, str),
				...(desc ? [
					new Msg(` - ${desc}`, "gray"),
				] : []),
			]);
		});
	},
	EXIT: async (plasma, client, args) => {
		client.chat([
			...MEDAL_ALERT,
			new Msg("Are you sure you want to exit? [", "gray"),
			new Msg("yes", "green", null, "yes lemme out!!"),
			new Msg("/", "gray"),
			new Msg("no", "red", null, "no ty ill play more"),
			new Msg("]", "gray"),
		]);
		let answer = args[1] || await ChatListener.prompt(client);
		let yes = answer[0].toLowerCase() === "y";
		if(yes) process.exit();
		init(plasma, client);
		return true;
	},
};

const mainMenuCommandDescriptions = {
	NICK: "Change your nickname",
	LIST: "Lists the main menu commands",
	EXIT: "Exit Plasma",
};

function init(plasma, client, cb = () => null){
	if(!client) return plasma.handleError(new Error("<Plasma.UI.MainMenu> CLIENT_UNDEFINED"));
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
	let ii = 0;
	let main = new TextMenu({
		header: [new Msg(div+"/"), new Msg("Plasma Client", "dark_aqua"), new Msg("\\"+div, "white"), "\n"],
		footer: ["\n", new Msg(div+"\\"), new Msg("Select Server", "gold"), new Msg("/"+div, "white")],
		contents: [
			...ServerList.map(({ name, ip }, idx) => {
				return [
					new Msg(plasma.consoleMode ? (`${idx + 1} > [`) : ("> ["), "white"),
					new Msg(ip, "aqua", [
						new Msg("Connect to ", "white"),
						new Msg('"'+name+'"', "aqua"),
						new Msg("\nIP: ", "gold"), new Msg(ip, "white"),
					], ip),
					new Msg("]", "white"),
				];
			}),


			" ",
			((direct_connect.length && direct_connect != plasma.localIP) ? [
				new Msg((plasma.consoleMode ? "0 " : "") + "- [direct connect]", "green", [
					new Msg("Connect to the last direct connect IP:", "white"),
					new Msg("\n"),
					new Msg(direct_connect, "gold")
				], direct_connect)
			] : null),
			
			" ",
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
			    new Msg("Console mode is on.", "gray"), "\n",
				PAD, new Msg("Type the IP address or the number in the list to connect.", "gray"), "\n",
				PAD, new Msg("Type '", "gray"),
				new Msg("@LIST", "white"),
				new Msg("' for main menu commands", "gray"),
			] : null),
		],
	});
	main.send(client);
	let getInput = async () => {
	    let message = await ChatListener.prompt(client);
		if(".,#$&;/".includes(message[0])) return getInput();
		if(!message.trim()) return getInput();
	    if(message.startsWith(menuPrefix)) {
	        let cmd = message.split(" ")[0].slice(1).toUpperCase();
	        if(!mainMenuCommands[cmd]) {
	            return getInput();
	        };
	        let stop = mainMenuCommands[cmd](plasma, client, message.split(" ").slice(1));
	        if(!stop && !(stop instanceof Promise)) getInput();
	    } else {
			if(!isNaN(message)) {
				if(message) {
					if(!ServerList[message - 1]) {
						client.chat([...MEDAL_ALERT, new Msg(`No server with number ${message}`, "gray")]);
						return getInput();
					};
					message = ServerList[message - 1].ip;
				} else {
					message = direct_connect;
				};
			};
			let h = message.split(":")[0];
			let p = message.split(":")[1] ?? 25565;
			client.chat([P, new Msg(`Connecting to '${h}${p === 25565 ? "" : `:${p}`}'${!plasma.proxy.nick ? "" : ` with username '${plasma.proxy.nick}'`}...`, "gray")]);
	        plasma.proxy.connect(client, {
	            host: h,
	            port: p,
	        });
			return null;
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
