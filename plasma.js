/*

	~ PLASMA CLIENT ~
	
	https://plasma-client.glitch.me/
	
	Made by Dennis_
	
	Github: TheAlan404
	MC: Alan404
	
	Discord: Dennis_#3272
	<@258638629839175681>
	
	Telegram: TheDennis
*/

const fs = require("fs");
const util = require("util");
const cproc = require("child_process")

if(parseInt(process.versions.node.split('.')[0]) < 14){
	console.log("ERROR! Your NodeJS version is old!");
	console.log("For Plasma to be able to run you must upgrade it.");
	console.log("Required version: At least 14");
	console.log("> https://nodejs.org/");
	process.exit();
}

try {
	if(!fs.existsSync("./node_modules")) throw new Error("not installed");
	require.resolve("minecraft-protocol")
	require.resolve("nbs.js")
	require.resolve("adm-zip")
	if(!require("nmp-player").SongPlayer) throw new Error("old nmp-player");
} catch(e){
	// install deps
	const badFolders = ["Desktop", "Masaüstü", "Download", "İndirilenler", "Belgeler"];
	if(badFolders.filter((fname) => __dirname.endsWith(fname)).length != 0) {
		console.log("--- /!\ --- WARNING --- /!\ ---\n")
		console.log(" Plasma Client uses a folder for its configs and libraries.")
		console.log(" Please put Plasma inside a folder.\n")
		console.log("--- /!\ --- WARNING --- /!\ ---")
		process.exit();
	};
	const deps = ["minecraft-protocol", "chalk", "prismarine-chat", "prismarine-nbt", "node-fetch", 
	"clipboardy", "nmp-player", "uuid", "socket.io-client", "nbs.js", "adm-zip"];
	console.log("--- Plasma Client Install ---");
	console.log("> Installing... (or updating)");
	let txt = cproc.execSync("npm install "+deps.join(" "));
	console.log("> Install complete! Starting...");
};

const mc = require("minecraft-protocol");
const nbt = require('prismarine-nbt');
const ChatMessage = require('prismarine-chat')('1.12.2');
const fetch = require("node-fetch");
const chalk = require("chalk");
const clip = require("clipboardy");
const { SongPlayer } = require("nmp-player");
const UUIDS = require("uuid");
const io = require("socket.io-client");
const NBS = require("nbs.js");
//const AdmZip = require('adm-zip'); // who put this here and *why*? -den

const version = "1.1.1";

let socketHost = "";
let socketCredentials = { id: null, token: null, };

let txtApiHost = "https:"+"//akiyamabot.glitch.me"; // txt system is deprecated + incomplete -den
let txtApiURL = txtApiHost+"/api/v1/txt/";
let notifyBotPlayers = {};

let socket = null;
let activeRoom = "global";

/** List of servers got from appdata */
let server_list = [];
/** Last direct connect IP got from appdata*/
let direct_connect;
let password_list = {};
let Prefix = ".";

let currentUsername;
let realUserNick;
let connectedServer;
let userEntityId = 0;
let playerEntityId;
let loadedChunks = new Set();
let clientSettings = {};

let entityList = {};
let UUIDtoNick = {};
let playerNickList = {};

let NPC_List = {};
let __uuidv3Namespace = new Array(16).map(i => Math.floor(Math.random()*20));
let clientPosition = { x: 0, y: 0, z: 0, };
let log = t => console.log(chalk.cyan("[Plasma]")+" "+chalk.gray(t));
process.title = "Plasma Client v"+version;
let adminToken = "";
let _client = null;
let disallow = {
	send: {},
	recieve: {
		kick_disconnect: ({ reason }) => {
			setTimeout(() => {
				notify("You got kicked:")
				notify(JSON.parse(reason))
			}, 500)
		},
		disconnect: ({ reason }) => {
			setTimeout(() => {
				notify("You got disconnected:")
				notify(JSON.parse(reason))
			}, 500)
		},
		chat: true,
	},
	sendAll: true,
	recieveAll: true,
};
let chat = {
	spammer: {
		enabled: false,
		interval: null,
		message: "Hello World!",
		delay: 2000,
		start(){
			this.interval = setInterval(this.send, this.delay);
			this.enabled = true;
		},
		stop(){
			if(this.interval) clearInterval(this.interval);
			this.enabled = false;
		},
		setDelay(ms){
			this.delay = ms;
			if(this.interval) {
				this.stop();
				this.start();
			};
		},
		send(){
			let msg = chat.spammer.message || "spam test!!";
			if(_client && _client.state == "play") {
				_client.write("chat", {
					message: msg,
				});
			};
		},
	},
	global: false,
};

/** A SongPlayer from nmp-player. Plays songs for users. */
let songPlayer = new SongPlayer();
songPlayer._note = function(packet){
	packet.x = clientPosition.x * 8;
	packet.y = clientPosition.y * 8;
	packet.z = clientPosition.z * 8;
	writeAll("sound_effect", packet);
	
	songPlayerBossBar.setPercentage(songPlayer.tick, songPlayer.song.length);
};
songPlayer.on("stop", () => {
	notify({
		text: "",
		extra: [new Msg("[P] ", "aqua"), new Msg("Music stopped.", "gray")],
	});
	songPlayerBossBar.setTitle({
		text: "",
		extra: [new Msg("♬", "dark_gray"), " Stopped - ", new Msg((songPlayer.song.title), "gold")],
	});
});
songPlayer.on("end", () => {
	notify({
		text: "",
		extra: [new Msg("[P] ", "aqua"), new Msg("Music ended.", "gray")],
	});
	songPlayerBossBar.setTitle({
		text: "",
		extra: [new Msg("♬", "dark_gray"), " Finished - ", new Msg((songPlayer.song.title), "gold")],
	});
	
	let t = songPlayer.tick;
	setTimeout(() => {
		if(t === songPlayer.tick) songPlayerBossBar.unload();
	}, 10 * 1000);
});

let wsSongPlayer = new SongPlayer();
wsSongPlayer._note = function(packet){
	if(!socket || !socket.connected) return;
	socket.emit("wsNote", wsSongPlayer.Room, {
		...packet,
	});
};
wsSongPlayer.Room = null;

let config = {};



async function showTxt(id){
	let res = await fetch(txtApiURL+id);
	let json = await res.json();
	notify(json);
};

async function createTxt(id, data){
	let res = await fetch(txtApiURL+id, {
		method: 'post',
        body:    JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
	});
	return id;
};



/**
	Boot function group
	@example boot("updates") // check for updates
*/
function boot(part, other){
	let crlf = (s) => s.replace(/\n/g, "\r\n");
	async function checkUpdates(type){
		try {
			let res = await fetch("https://plasma-client.glitch.me/index.json");
			let json = await res.json();
			
			if(type == "cfg") return json.defaultConfig.join("\n");
			if(type == "update") return json.updateSource;
			
			if(json.version != version) {
				let prefix = chalk.cyan("[Update]")+" ";
				console.log(prefix+chalk.gray("A new version has been detected. Please update :3"));
				console.log(prefix+chalk.gray("Your version:  ")+chalk.redBright(version));
				console.log(prefix+chalk.gray("New version:   ")+chalk.greenBright(json.version));
			};
			return json.version == version; // returns bool:upToDate
		} catch(err){
			if(type == "cfg") return "# default config load error - "+e.toString();
			console.log(chalk.cyan("[Update] - Error!: ")+err.toString());
			notify("[Update] - Error!: "+err.toString());
			console.log("Either your internet is down or the servers are down.");
			notify("Either your internet is down or the servers are down.");
			return true;
		};
	};
	
	
	async function updateSelf(){ // incomplete
		const src = await checkUpdates("update");
		const res = await fetch(src);
		const fStream = fs.createWriteStream("./PlasmaClient_new.zip");
		res.body.pipe(fStream);
		res.body.on("error", (err) => {
			console.log("Update | Error!: "+err.toString());
		});
		fStream.on("finish", function() {
			console.log("Update | Downloaded, extracting from zip...");
			
		});
	};
	
	
	async function loadServers(){
		if(fs.existsSync(process.env.APPDATA + "/.minecraft/options.txt")) {
			let opts = fs.readFileSync(process.env.APPDATA + "/.minecraft/options.txt").toString();
			opts.replace(/\r/g, "").split("\n").forEach(function(line){
				let arr = line.split(":");
				if(arr[0] == "lastServer") 
					direct_connect = arr.slice(1).join(":");
			});
		};
		
		if(fs.existsSync(process.env.APPDATA + "/.minecraft/servers.dat")) {
			let servers = nbt.simplify(nbt.parseUncompressed(fs.readFileSync(process.env.APPDATA + "/.minecraft/servers.dat"))).servers;
			server_list = servers;
		};
		return server_list;
	};
	
	async function loadPasswords(){
		if(fs.existsSync("./passwords.txt")){
			let txt = fs.readFileSync("./passwords.txt").toString().replace(/\r/g, "");
			let list = txt.split("\n").map(i => i.trim());
			list.filter(i => i.length !== 0).forEach(function(item){
				if(item.startsWith("#")) return;
				try {
					let sp = item.split(":").map(i => i.trim());
					let sv = sp[0];
					let nick = sp[1];
					let pass = sp[2];
					if(!sv || !nick || !pass) throw new Error("password typed incorrect");
					if(!password_list[sv]) password_list[sv] = {};
					password_list[sv][nick] = pass;
				} catch(e){
					console.log("[Plasma] passwords.txt - error: "+e.toString());
				};
			});
		} else {
			fs.writeFileSync("./passwords.txt", crlf("# ✧ Plasma Client\n"+
			"# Automatic /login database.\n"+
			"# If you type passwords in here plasma will try to login with it.\n"+
			"# Syntax: 'ip:nick:password'\n\n\n"));
			log("passwords.txt created.");
		};
	};
	
	async function loadConfig(){
		if(fs.existsSync("./config.txt")){
			let txt = fs.readFileSync("./config.txt").toString().replace(/\r/g, "");
			let list = txt.split("\n").map(i => i.trim());
			list.filter(i => i.length !== 0).forEach(function(item){
				if(item.startsWith("#")) return;
				try {
					let sp = item.split(":").map(i => i.trim());
					if(!sp[1]) sp[1] = "true";
					config[sp[0]] = (sp[1] == "true" || sp[1] == "false" ? Boolean(sp[1]) : (isNaN(sp[1]) ? sp[1] : Number(sp[1]) ));
				} catch(e){
					console.log("[Plasma] config.txt - error: "+e.toString());
				};
			});
		} else {
			fs.writeFileSync("./config.txt", crlf(await checkUpdates("cfg")));
			log("config created");
			return await boot("config");
		};
	};
	
	async function setupSongs(){
		if(!fs.existsSync("./songs")) {
			try {
				let res = await fetch("https://plasma-client.glitch.me/songs.json");
				let { songs } = await res.json();
				fs.mkdirSync("./songs");
				songs.forEach(async function(song){
					const res = await fetch(song.downloadLink);
					const fileStream = fs.createWriteStream("./songs/"+song.filename+".nbs");
					res.body.pipe(fileStream);
					res.body.on("error", (err) => {
						console.log("Default song download error: "+err.toString());
					});
					fileStream.on("finish", function() {
						console.log("Default song downloaded: "+song.filename);
					});
				});
			} catch(e){
				if(!fs.existsSync("./songs")) fs.mkdirSync("./songs");
				log("Default songs couldn't be downloaded!");
				console.log(e);
			};
		};
	};
	
	async function loadPlugins(){
		if(!fs.existsSync("./plasma_plugins.txt")) {
			let txt = "# Plasma Client Plugin List\n";
			txt += "# Info: https://plasma-client.glitch.me/plugins.html \n";
			txt += "# Every line is a file name that will try to be require()'d\n";
			fs.writeFileSync("./plasma_plugins.txt", crlf(txt));
		};
		
		let txt = fs.readFileSync("./plasma_plugins.txt").toString().replace(/\r/g, "");
		let list = txt.split("\n").map(i => i.trim());
		list.filter(i => i.length !== 0).filter(i => !i.startsWith("#")).forEach(async function(pluginPath){
			try {
				let exp = require(pluginPath);
				let f = typeof exp == "function" ? exp : exp.plasma;
				let p = f(getPlasmaAPI());
				log("Plugin could not be loaded: "+(p && p.name ? p.name : pluginPath));
			} catch(e) {
				if(e.code == "MODULE_NOT_FOUND") {
					console.log(chalk.red("[PluginError]")+chalk.gray(" Plugin not found: ")+pluginPath);
				} else {
					console.log(chalk.red("[PluginError]")+" Plugin gave an error:", e);
				};
			};
		});
	};
	
	
	
	if(part == "updates") return checkUpdates();
	if(part == "servers") return loadServers();
	if(part == "passwords") return loadPasswords();
	if(part == "config") return loadConfig();
	if(part == "songs") return setupSongs();
	if(part == "plugins") return loadPlugins();
	if(part == "notifBot") {
		(async function(){
			let res = await fetch(txtApiHost+"/api/v1/bots");
			notifyBotPlayers = await res.json();
		})();
	};
	if(part == "addPassword") {
		let txt = fs.readFileSync("./passwords.txt").toString();
		txt += other + "\n";
		fs.writeFileSync("./passwords.txt", crlf(txt));
	};
};
boot("updates");
boot("servers");
boot("songs");
boot("plugins");
boot("config").then(function(){
	if(config.autoLogin || config.autoSavePasswords) boot("passwords");
	if(config.prefix) Prefix = config.prefix;
});
//boot("notifBot");


function getPlasmaAPI(){
	return {
		getTargetClient(){
			return _client;
		},
		getUserClient(){
			return server.clients[0];
		},
		getPosition(){
			return clientPosition;
		},
		write(name, data){
			writeAll(name, data);
		},
		addCommand,
		Commands,
		SongPlayer: songPlayer,
		version,
		config,
		tokens,
		notify,
	};
};




let database = {};
database._data = {
	config: {},
	elevators: {},
	npcs: {},
	skinHistory: {},
	shortcutList: {},
	pluginData: {},
	passwords: {},
	friends: {},
	wstoken: "",
	lastLogin: Date.now(),
};
database.load = function(){
	let json = {};
	let data = fs.readFileSync("./plasma_db.json");
	try {
		json = JSON.parse(data);
	} catch(e){
		console.log("ERROR | plasma_db.json CORRUPTED - please delete or fix!");
	};
	this._data = json;
};
database.get = function(){};
database.set = function(){};
database.load = function(){};
if(!fs.existsSync("./plasma_db.json")) fs.writeFileSync("./plasma_db.json", JSON.stringify(database._data));
database.load();
fs.watch("./plasma_db.json", function(event, fn){
	if(event != "change" || !fn) return;
	database.load();
});










function tokens(str) {
	str = str.replace(/:date/g, new Date(Date.now()).toLocaleString());
	return str;
};

if(require.main !== module && !global.Pirate) {
	console.log(chalk.red("[Plasma]")+" require() detected. plz use plugin system for stuff :c");
	process.exit();
};



class Msg {
	constructor(text, color, hover, click, suggest){
		if(text) this.text(text);
		if(color) this.color(color);
		if(hover) this.hover(hover);
		if(click) this.click(click);
		if(suggest) this.suggest(suggest);
		return this;
	};
	text(t){
		this._text = t;
		return this;
	};
	color(color){
		this._color = color;
		return this;
	};
	hover(text){
		this._hover = text;
		return this;
	};
	suggest(text){
		this._click = text;
		this._clickAction = "suggest_command";
		return this;
	};
	click(text){
		this._click = text;
		this._clickAction = "run_command";
		if(text.startsWith("http")) this._clickAction = "open_url";
		return this;
	};
	toJSON(){
		return {
			text: this._text,
			color: this._color,
			hoverEvent: this._hover ? {
				action: "show_text",
				value: this._hover,
			} : undefined,
			clickEvent: this._click ? {
				action: this._clickAction,
				value: this._click,
			} : undefined,
		};
	};
};






















const server = mc.createServer({
	'online-mode': false,
	port: process.env.PLASMA_PORT || 25565,
	version: "1.12.2",
	motd: "--- Plasma Client ---\Version: v"+version,
	'max-players': 1,
});

server.on("error", function (error) {
	let str = error.toString();
	if(str.length > 15) str = str.slice(12)+"...";
	console.log(chalk.redBright("/!\\ Hata: ")+chalk.gray(str));
})

server.on("listening", function () {
	let port = server.socketServer.address().port;
	console.log(chalk.cyan("[Plasma]")+chalk.gray(" Ready! Login to ")+chalk.white("localhost:"+port)+chalk.gray(" to use Plasma."));
});








server.on("login", function(client){
	client.write('login', {
		entityId: userEntityId,
		levelType: 'default',
		gameMode: 0,
		dimension: 0,
		difficulty: 2,
		maxPlayers: server.maxPlayers,
		reducedDebugInfo: false
	});
	client.write('position', {
		x: 0,
		y: 1.62,
		z: 0,
		yaw: 0,
		pitch: 0,
		flags: 0x00
	});
	
	
	console.log(chalk.cyan("[Plasma] ")+chalk.yellow(client.username)+chalk.gray(" Plasma'ya girdi."));
	wChat(client, [{text:"Hoşgeldin ",color:"gray"},{text:client.username, color:"gold"},{text:"."}]);
	wChat(client, [{text:"Saat/Tarih: ",color:"gray"},{text:new Date(Date.now()).toLocaleString(),color:"aqua"}]);
	if(_client) {
		bind(client);
		notify(">>> Countiniuing with session...");
		notify("You can disconnect via the '"+Prefix+"dc' command.");
	} else {
		serverSelector(client);
	};
	bindCommands(client);
	
	client.on("packet", function(data, meta){
		if(_client) filterSend(client, data, meta, _client)
	});
	
	realUserNick = client.username;
	if(socket && socket.connected) {
		socket.emit("setRealNick", client.username);
	};
	client.on("settings", function(s){
		clientSettings = s;
	});
});






function serverSelector(client, cb){
	if(_client) _client.end(); // TODO: fix this properly??
	wChat(client, " \n \n \n \n \n ");
	let thisIP = "localhost";
	if(server.socketServer.address().port !== 25565) thisIP = "localhost:"+server.socketServer.address().port;
	wChat(client, [{text:"-".repeat(10)+"/"}, {text:"Plasma Client",color:"dark_aqua"}, {text:"\\"+"-".repeat(10),color:"white"}, ]);
	wChat(client, " ");
	for(let indx in server_list){
		let { name, ip } = server_list[indx];
		if(ip == thisIP) continue;
		wChat(client, [{text: "- ["}, 
			new Msg(ip, "aqua", null, ip).hover([
				new Msg("Connect to ", "white"),
				new Msg('"'+name+'"', "aqua"),
				new Msg("\nIP: ", "gold"), new Msg(ip, "white")
			]),
			{text: "]"},
		]);
	};
	if(direct_connect && direct_connect != thisIP) wChat(client, [
		{text:"> ["},
			new Msg("direct connect", "green", null, direct_connect).hover([
				new Msg("Connect to the last direct connect IP:", "white"),
				new Msg("\n"),
				new Msg(direct_connect, "gold")
			]),
		{text:"]"}
	]);
	wChat(client, " ");
	wChat(client, "Alternatif olarak IP adresini sohbete yazın.");
	wChat(client, [
		new Msg(" [✧ Refresh] ", "gold", 
			new Msg("Refreshes the server list\nIf no server is listed click this button.", "gray"), "_REFRESH"),
		new Msg(" [✧ Update] ", "dark_purple",
			new Msg("Check for updates.", "gray"), "_UPDATES"),
		new Msg(" [✧ Change Nick] ", "blue",
			new Msg("Changes nick", "gray"), "_NICK"),
		new Msg(" [✧ Change Prefix] ", "gray",
			new Msg("Changes the command prefix.\Will be changed via a config command in the future.", "gray"), "_PREFIX"),
	]);
	if(currentUsername) wChat(client, [
		new Msg(" (i) ", "green"), new Msg("Your nick is currently ", "gray"), new Msg(currentUsername, "gold"), new Msg(".", "gray"),
	]);
	wChat(client, " ");
	wChat(client, [{text:"-".repeat(10)+"\\"}, {text:"Select Server.",color:"dark_aqua"}, {text:"/"+"-".repeat(10),color:"white"}, ]);
	
	let menu = function({ message }){
		let ip = message;
		if(ip.startsWith("_")) {
			if(ip == "_REFRESH") {
				client.removeListener("chat", menu);
				serverSelector(client, function(){
					notify("> List refreshed!");
				});
			};
			if(ip == "_UPDATES") {
				boot("updates").then(function(latest){
					if(latest) {
						notify("> You are using the latest version.");
					} else {
						notify("> A new version has been released. Look in the console!");
					};
				});
			};
			if(ip == "_NICK") {
				client.removeListener("chat", menu);
				function listener(p){
					let nick = p.message;
					wChat(client, new Msg("> "+nick));
					function checkNick(){
						if(nick.length > 16) return true;
						let allowed = "abcdefghijklmnoprstuvxyzqwABCDEFGHIJKLMNOPRSTUVXYZQW1234567890_";
						return !(nick.split("").filter(c => allowed.includes(c)).length === nick.length);
					};
					if(checkNick()){
						wChat(client, [new Msg("[Nick] ", "blue"), new Msg("Illegal nick, try again:", "gray")]);
						return;
					};
					currentUsername = nick;
					client.removeListener("chat", listener);
					serverSelector(client, function(){
						wChat(client, [new Msg("[Nick] ", "blue"), new Msg("Nick changed.", "gray")]);
					});
					if(socket && socket.connected) {
						socket.emit("changeNick", nick);
					};
				};
				client.on("chat", listener);
				wChat(client, [new Msg("[Nick] ", "blue"), new Msg("Type your nick:", "gray")]);
			};
			if(ip == "_PREFIX") {
				client.removeListener("chat", menu);
				function listener(p){
					let pfx = p.message;
					wChat(client, new Msg("> "+pfx));
					Prefix = pfx;
					client.removeListener("chat", listener);
					serverSelector(client, function(){
						wChat(client, [new Msg("[Prefix] ", "dark_gray"), new Msg("Prefix changed. (until plasma is restarted)", "gray")]);
					});
				};
				client.on("chat", listener);
				wChat(client, [new Msg("[Prefix] ", "dark_gray"), new Msg("Type new prefix:", "gray")]);
			};
		} else {
			client.removeListener("chat", menu);
			notify(">>> Connecting...");
			createProxy(client, { host: ip.split(":")[0], port:ip.split(":")[1] || 25565, version: "1.12.2", });
		};
	};
	client.on("chat", menu);
	if(cb) {
		cb();
	} else wChat(client, " ");
};








function notify(text, color){
	let msg;
	if(Array.isArray(text)) {
		msg = [{text:"[Plasma] ",color:"dark_aqua"}]
		text.forEach(item => msg.push(item));
	} else if(typeof text != "string") {
		msg = text;
	} else {
		msg = [{text:"[Plasma] ",color:"dark_aqua"},{text:text,color:(color||"gray")}];
	};
	for(let id in server.clients){
		wChat(server.clients[id], msg);
	};
};

function wChat(cli, c){
	cli.write("chat", { message: JSON.stringify(c) });
};





let debug_messagePacket = false;
function createProxy(client, opts){
	console.log(chalk.cyan("[Plasma] ")+chalk.gray("Connecting to -> ")+opts.host+":"+opts.port);
	if(!opts.username) opts.username = currentUsername || client.username;
	
	_client = mc.createClient(opts);
	
	bind(client);
	
	if(socket && socket.connected) socket.emit("joinServer", opts.host) // to connect to secret rooms notify the ws
	connectedServer = opts.host;
	
	_client.on("login", function(){
		_client.write("settings", clientSettings)
	});
	
	let __packet = [];
	Object.keys(UUIDtoNick).forEach(uuid => __packet.push({UUID: uuid}))
	client.write("player_info", {
		action: 4,
		data: __packet,
	});
	UUIDtoNick = {};
	
	_client.on("player_info", function(packet){
		packet.data.forEach(function(item){
			if(packet.action === 0) {
				UUIDtoNick[item.UUID] = item.name;
				playerNickList[item.name] = true;
				
				if(notifyBotPlayers[item.name]) setTimeout(() => {
					let m = notifyBotPlayers[item.name];
					_client.write("chat", { message: typeof m == "boolean" ? "/msg "+item.name+" plasma-client" : m });
				}, 1000);
				
			};
			if(packet.action === 4) {
				delete playerNickList[UUIDtoNick[item.UUID]];
			};
		});
	});
	
	_client.on("chat", function(packet){
		
		if(debug_messagePacket) console.log(packet);
		
		try {
			function clickPmChilds(a, indx, all){
				if(typeof a == "string") return a;
				let allowed = "abcdefghijklmnoprstuvxyzqwABCDEFGHIJKLMNOPRSTUVXYZQW1234567890_";
				let t = a.text.trim().split("").filter(c => allowed.includes(c)).join("");
				// hızlı mesaj
				if(config.clickPm && playerNickList[t]) {
					a.clickEvent = {
						action: "suggest_command",
						value: "/msg "+t+" ",
					};
					a.hoverEvent = {
						action: "show_text",
						value: [new Msg("[Plasma] ", "dark_aqua"), new Msg("Fast message: Click", "gray")],
					};
				};
				return a;
			};
			let m = JSON.parse(packet.message);
			if(Array.isArray(m)) {
				m.map(buttonify)
				m.map(clickPmChilds)
			} else if(typeof m == "object"){
				if(m.extra) {
					m.extra.map(clickPmChilds);
					m.extra.map(buttonify);
				};
			};
			client.write("chat", { message: JSON.stringify(m), });
		} catch (e) {
			client.write("chat", packet);
			console.log(chalk.redBright("Modified chat error: "+e.toString()));
		};
		
		if((packet.message.includes("/login") || packet.message.includes("/giriş")) && config.autoLogin && _client){
			let lh = _client.socket._host;
			let lu = _client.username;
			//console.log(lh, lu, password_list);
			if(password_list[lh] && password_list[lh][lu]) {
				_client.write("chat", { message: "/login "+password_list[lh][lu] });
				log("Otomatik login yapıldı.");
			};
		};
	});
	
	_client.on("unload_chunk", function({ chunkX, chunkZ }){
		loadedChunks.delete(chunkX+";"+chunkZ);
		for(let id in elevatorList) {
			let elev = elevatorList[id];
			if(elev.chunkPos[0] == chunkX && elev.chunkPos[1] == chunkZ) {
				elevatorList[id].loaded = false;
			};
		};
	});
	
	_client.on("map_chunk", function({ x, z }){
		loadedChunks.add(x+";"+z);
		for(let id in elevatorList) {
			let elev = elevatorList[id];
			if(elev.chunkPos[0] == x && elev.chunkPos[1] == z) {
				elevatorList[id].sendPacket();
			};
		};
	});
	
	/* Normal Client */
	client.on("use_entity", function({ target }){
		if(elevatorList[target]) elevatorList[target].sendControls();
	});
};






function buttonify(a, indx, all){
	if(typeof a == "string") return a;
	
	let p = new Msg("[Plasma] ", "dark_aqua");
	
	// copy:yazı
	
	let _ = " ඞ";
	if(a.text.trim().toLowerCase() == "am"+"OG".toLowerCase()+"us" && true) all.splice(indx+1, 0, new Msg(_, "red", new Msg("red sus.", "gold")));
	_ = " ☞☜";
	if(a.text.trim().toLowerCase().replace("?", "") == "is f"+"or me") all.splice(indx+1, 0, new Msg(_, "red", new Msg(":flushed:", "gold")));
	
	if(a.text.trim().startsWith("copy:")) {
		all.splice(indx+1, 0, new Msg(" (✄)", (a.color == "aqua" ? "dark_aqua" : "aqua"), [
			p, new Msg("Click and copy", "gray")
		], ".copy "+a.text.trim().replace("copy:", "")));
	};
	if(a.text.trim().startsWith("yt:")) {
		let link = "https://www.youtube.com/watch?v="+a.text.trim().replace("yt:", "").slice(0, 11);
		let j = new Msg(" (►)", (a.color == "red" ? "dark_red" : "red"), [
			p, new Msg("Go to the youtube video", "gray")
		], link);
		all.splice(indx+1, 0, j);
	};
	if(a.text.trim().startsWith("pinterest:")) {
		let link = "https://in.pinterest.com/pin/"+a.text.trim().replace("pinterest:", "").slice(0, 11);
		let j = new Msg(" (☟)", (a.color == "red" ? "dark_red" : "red"), [
			p, new Msg("Go to the pinterest pin", "gray")
		], link);
		all.splice(indx+1, 0, j);
	};
	if(a.text.trim().startsWith("namemc:")) {
		let nick = a.text.trim().replace("namemc:", "").split(" ")[0];
		let link = "https://namemc.com/profile/"+nick;
		let j = new Msg(" (ⓝ)", (a.color == "dark_gray" ? "gray" : "dark_gray"), [p, new Msg("Open the NameMC profile", "gray")], link);
		let k = new Msg(" (☄)", (a.color == "gray" ? "dark_gray" : "gray"), [p, new Msg("Set as skin", "gray")], null, "/skin set "+nick);
		all.splice(indx+2, 0, k);
		all.splice(indx+1, 0, j);
	};
	if(a.text.trim().startsWith("skin:")) {
		let id = a.text.trim().replace("skin:", "").split(" ")[0];
		let link = "https://namemc.com/skin/"+id;
		let linkpng = "https://namemc.com/texture/"+id+".png?v=2";
		let j = new Msg(" (✿)", (a.color == "blue" ? "dark_blue" : "blue"), [p, new Msg("Open the NameMC skin", "gray")], link);
		let k = new Msg(" (☄)", (a.color == "green" ? "dark_green" : "green"), [p, new Msg("Download the skin", "gray")], linkpng);
		all.splice(indx+2, 0, k);
		all.splice(indx+1, 0, j);
	};
	if(a.text.trim().startsWith("novaskin:")) {
		let id = a.text.trim().replace("novaskin:", "").split(" ")[0];
		let link = "https://minecraft.novaskin.me/skin/"+id;
		let linkpng = "http://novask.in/"+id+".png";
		let j = new Msg(" (✿)", (a.color == "blue" ? "dark_blue" : "blue"), [p, new Msg("Open the Novaskin", "gray")], link);
		let k = new Msg(" (☄)", (a.color == "green" ? "dark_green" : "green"), [p, new Msg("Set as skin", "gray")], null, "/skin set "+linkpng);
		all.splice(indx+2, 0, k);
		all.splice(indx+1, 0, j);
	};
	if(a.text.trim().startsWith("ngws:")) {
		let text = a.text.trim().replace("ngws:", "").split(" ")[0];
		let host = "https://"+text+".ngrok.io/";
		let j = new Msg(" (✧)", (a.color == "gold" ? "yellow" : "gold"), [p, new Msg("Connect to WS", "gray")], ".wss "+host);
		all.splice(indx+1, 0, j);
	};
	
	
	// isnt related to this function but whatever
	if(a.text.trim().startsWith("txt#")){
		let id = a.text.trim().replace("txt#", "").split(" ")[0];
		showTxt(id);
	};
	
	
	
	return a;
};














let bint = false;
function bind(client){
	bint = true;
	_client.on("packet", function(data, meta){
		filterSend(_client, data, meta, client)
	});
	
	_client.on("end", function(){
		serverSelector(client, function(){
			notify("> Disconnected.");
		});
		_client = null;
		connectedServer = null;
	});
	
	_client.on("error", function(err){
		wChat(client, [{text:"[Plasma] ",color:"dark_aqua"},{text:"/!\\ Error: ",color:"red"},{text:err.toString(),color:"gray"}]);
	});
};


function writeAll(n, d){
	for(clientID in server.clients){
		let client = server.clients[clientID];
		client.write(n, d);
	};
};

function sendMapArt(id, data) {
	writeAll("map", {
		itemDamage: id,
		scale: 4,
		trackingPosition: false,
		icons: [],
		columns: -128,
		rows: -128,
		x: 0,
		y: 0,
		data: data,
	});
};


let debugNames;
let debug__ = false;
let debugPackets = false;
let __aR = [];
function filterSend(sender, data, meta, reciever){
	let route = {};
	let packetname = meta.name;
	
	//console.log(chalk[sender.isServer ? "cyan" : "blue"](packetname));
	if(!sender || !reciever) return;
	
	if(sender.isServer) {
		route.desc = "user->proxy->client";
		route.r = "send";
	};
	if(!sender.isServer) {
		route.desc = "client->proxy->user";
		route.r = "recieve";
	};
	
	
	
	if(packetname == "position") {
		clientPosition = data;
		handlePosChange();
	};
	
	if(packetname == "login") {
		playerEntityId = data.entityId;
	};
	
	// entityId fix
	if(data && data.entityId){
		if(route.r == "recieve" && data.entityId == playerEntityId){
			data.entityId = userEntityId;
		};
		if(route.r == "send" && data.entityId == userEntityId){
			data.entityId = playerEntityId;
		};
	};
	
	
	
	if(debugNames) console.log(route.desc+" "+packetname);
	if(debugPackets) console.log(packetname, data);
	if(disallow[route.r][packetname]) {
		let val = disallow[route.r][packetname];
		if(typeof val == "function") val(data, meta);
		
		return;
	};
	
	if(!disallow[route.r+"All"]) return;
	
	// command
	if(route.r == "send" && packetname == "chat" && data.message.startsWith(Prefix)) {
		if(data.message[1] != "." && data.message[1] != "/" && data.message != ".d" && data.message != "._.") {
			if(data.message.startsWith(Prefix+"copy ")) return;
			wChat(sender, "> "+data.message); // disabled.
			return;
		};
	};
	
	const doNot = ["keep_alive", "login"];
	if(doNot.includes(packetname)) return;
	if(
		meta.state === "play" &&
		sender.state === "play" &&
		reciever.state === "play"
	) reciever.write(packetname, data);
};







function handlePosChange(){
	for(let id in elevatorList){
		let elevator = elevatorList[id];
		if(elevator.isNear()) {
			elevator.sendBossBar();
		} else {
			elevator.unloadBossBar();
		};
	};
};





const LCTR_DISPLAY = ([
	[22168, 22160, 22152, 22144, 22136, 22128, 22120, 22112, 22104, 22096, 22088],
	[22169, 22161, 22153, 22145, 22137, 22129, 22121, 22113, 22105, 22097, 22089],
	[22170, 22162, 22154, 22146, 22138, 22130, 22122, 22114, 22106, 22098, 22090],
	
	[22171, 22163, 22155, 22147, 22139, 22131, 22123, 22115, 22107, 22099, 22091],
	[22172, 22164, 22156, 22148, 22140, 22132, 22124, 22116, 22108, 22100, 22092],
	[22173, 22165, 22157, 22149, 22141, 22133, 22125, 22117, 22109, 22101, 22093],
	
	[22174, 22166, 22158, 22150, 22142, 22134, 22126, 22118, 22110, 22102, 22094],
	[22175, 22167, 22159, 22151, 22143, 22135, 22127, 22119, 22111, 22103, 22095],
]).map(i => i.reverse());

function __lctrD(){
	LCTR_DISPLAY.forEach(function(row){
		row.forEach(function(mapId){
			writeAll("map", {
				itemDamage: mapId,
				scale: 4,
				trackingPosition: false,
				icons: [],
				columns: -128,
				rows: -128,
				x: 0,
				y: 0,
				data: Buffer.alloc(128*128).fill(29),
			});
		});
	});
};




// .eval new NPC({ ...clientPosition, name:"urMom",  skin: TESTSKIN})
const TESTSKIN = "http://textures.minecraft.net/texture/786c039d969d1839155255e38e7b06a626ea9f8baf9cb55e0a77311efe18a3e";
/*
"ewogICJ0aW1lc3RhbXAiIDogMTYxNTgxMzQ0NTU4NiwKICAicHJvZmlsZUlkIiA6ICJiODc2ZWMzMmUzOTY0NzZiYTExNTg0MzhkODNjNjdkN"+
"CIsCiAgInByb2ZpbGVOYW1lIiA6ICJUZWNobm9ibGFkZSIsCiAgInRleHR1cmVzIiA6IHsKICAgICJTS0lOIiA6IHsKICAgICAgInVybCIgOiAiaHR0cDovL3RleHR"+
"1cmVzLm1pbmVjcmFmdC5uZXQvdGV4dHVyZS83ODZjMDM5ZDk2OWQxODM5MTU1MjU1ZTM4ZTdiMDZhNjI2ZWE5ZjhiYWY5Y2I1NWUwYTc3MzExZWZlMThhM2UiCiAgI"+
"CB9CiAgfQp9";*/

let NPCList = {};
class NPC {
	constructor(opts = {}){
		this.name = opts.name || "Unnamed_NPC";
		this.displayName = opts.displayName;
		this.skin = opts.skin ? opts.skin : false;
		
		this.UUID = (opts.UUID && UUIDS.validate(opts.UUID) ? opts.UUID : UUIDS.v3("OfflinePlayer:"+(opts.name), __uuidv3Namespace));
		this.entityId = opts.entityId || Math.floor(Math.random() * 10000000);
		this.loaded = false;
		
		this.x = opts.x;
		this.y = opts.y;
		this.z = opts.z;
		this.yaw = opts.yaw || 0;
		this.pitch = opts.pitch || 0;
		this.sendPacket();
		NPCList[this.entityId] = this;
	};
	// .eval new Elevator({entityId:31,x:-4443.5, y:57, z:214.5})
	sendPacket(){
		if(this.loaded){
			this.moveTo();
		} else {
			this.spawnClient();
			this.spawnEntity();
			//this.despawnClient();
		};
	};
	spawnEntity(){
		writeAll("named_entity_spawn", {
			playerUUID: this.UUID,
			entityId: this.entityId,
			x: this.x,
			y: this.y,
			z: this.z,
			yaw: this.yaw,
			pitch: this.pitch,
			metadata: [],
		});
	};
	spawnClient(){
		let props = [];
		if(this.skin) props.push({
			name: "textures",
			value: this.skin,
		});
		
		writeAll("player_info", {
			action: 0,
			data: [{
				name: this.name,
				ping: 10,
				UUID: this.UUID,
				gamemode: 1,
				displayName: this.displayName,
				properties: props,
			}],
		});
	};
	despawnClient(){
		writeAll("player_info", {
			action: 4,
			data: [{
				UUID: this.UUID,
			}],
		});
	};
	moveTo(x=this.x, y=this.y, z=this.z, yaw=this.yaw, pitch=this.pitch){
		writeAll("entity_teleport", {
			entityId: this.entityId,
			x: x,
			y: y,
			z: z,
			pitch: pitch,
			yaw: yaw,
			onGround: true,
		});
	};
};



let elevatorList = {};

class Floor {
	/**
	* Represents a floor for an elevator
	* @constructor
	* @param {object} [opts]
	* @param {number} opts.y - world coordinate
	* @param {string} opts.title - title of the floor, ex: "Cafeteria"
	* @param {number} opts.index - index of the floor, doesnt have to be anything its just for display.
	* @param {string} opts.msg - subtitle message override
	*/
	constructor(opts={}){
		this.y = opts.y || 64;
		this.title = opts.title || null;
		this.index = opts.index || 0;
		this.msg = opts.msg || null;
	};
	makeMsg(){
		if(this.msg) return this.msg;
		if(this.index===undefined) return [new Msg("f l o o r.", "gray")]; // easter egg kekw -den
		let m = [new Msg("Floor ", "gray"), new Msg(this.index+"", "dark_aqua")];
		if(this.title) m.push(new Msg(": ", "gray"), new Msg(this.title, "blue"));
		return m;
	};
};

let thicc;
function elevTest(){
	
	/* RIP LegendCraft server, you will be missed by dennis. */
	
	let floors = [
		{
			y: 50,
			index: -1,
			title: "Otopark",
		},
		{
			y: 66,
			index: 0,
			title: "Giriş Kat",
		},
		{
			y: 76,
			index: 1,
		}
	];
	
	thicc = new Elevator({
		floors,
		x: -4443.5,
		y: 66,
		z: 214.5,
		currentFloor: 1,
	});
	
	return thicc;
};

/**
* Makes minecraft screen title subtitle for you
* @param {string} m - the subtitle text
*/
function makeSubtitle(m){
	writeAll("title", {
		action: 1,
		text: JSON.stringify(m),
	});
	writeAll("title", {
		action: 0,
		text: JSON.stringify(""),
	});
};

function percentage(partialValue, totalValue) {
	return (100 * partialValue) / totalValue;
} 


// EXPREIMENTAL
class ThickElevator {
	constructor(data){
		this.floors = data.floors || [new Floor({
			y: this.y,
			index: 0,
		})];
		this.elevators = data.elevators || [];
	};
	goToFloor(n){
		this.elevators.forEach(e => e.goToFloor(n));
	};
	floorUp(){
		this.elevators.forEach(e => e.floorUp());
	};
	floorDown(){
		this.elevators.forEach(e => e.floorDown());
	};
	stop(){
		this.elevators.forEach(e => e.stop());
	};
};




class BossBar {
	/**
	* A BossBar:tm:
	* @param {object} opts
	* @param {UUID} opts.UUID
	* @param {number} opts.color
	* @param {string} opts.title
	* @param {number} opts.health - progress bar é (between one and zero, more breaks the mc client's renderer lul)
	* @param {boolean} silent - if true will not send the packet on init
	* @example new BossBar({ title: "pogness of null and reis", health: 3 });
	*/
	constructor(opts){
		this.loaded = false;
		this.UUID = opts.UUID || UUIDS.v1();
		this.color = opts.color || 1;
		this.title = opts.title || [new Msg("[Plasma] Unnamed BossBar", "dark_aqua")];
		this.health = opts.health || 1;
		if(!opts.silent) this.sendPacket();
	};
	sendPacket(newHealth=this.health){
		this.health = newHealth;
		//let calcHealth = () => percentage(this.currentFloor + (this.busy ? 0.5 : 0), this.floors.length-1) / 100;
		if(this.loaded){
			writeAll("boss_bar", {
				entityUUID: this.UUID,
				action: 2,
				health: this.health,
			});
		} else {
			writeAll("boss_bar", {
				entityUUID: this.UUID,
				action: 0,
				title: JSON.stringify(this.title),
				color: this.color,
				health: this.health,
				dividers: 0,
				flags: 0,
			});
			this.loaded = true;
		};
	};
	/** Sets title */
	setTitle(title=this.title){
		this.title = title;
		//let calcHealth = () => percentage(this.currentFloor + (this.busy ? 0.5 : 0), this.floors.length-1) / 100;
		if(this.loaded){
			writeAll("boss_bar", {
				entityUUID: this.UUID,
				action: 3,
				title: JSON.stringify(this.title),
			});
		} else {
			this.sendPacket();
		};
	};
	/** Sets percentage */
	setPercentage(part, full){
		this.sendPacket(percentage(part, full)/100);
	};
	/** unloads/hides the bossbar */
	unload(){
		if(!this.loaded) return;
		writeAll("boss_bar", {
			entityUUID: this.UUID,
			action: 1,
		});
		this.loaded = false;
	};
};

// needed to be on top but bruh'd
const songPlayerBossBar = new BossBar({
	silent: true,
	title: ["There isnt any music playing right now"],
	health: 0,
});


class Elevator {
	/**
	* Elevator class
	* an elevator consists of two boat entities, one is the floor and the other is the ceiling
	* to go up, the client recieves levitation effect so they rise up, and because the levitation speed is inconsistent (0.9 blocks/s smh) the
	* ceiling boat stops the player from going up too much.
	* - The elevator position is counted as the floor boat entity
	* @constructor
	* @param {object} opts
	* @param {object} opts.bossbar - custom bossbar properties
	* @param {number} opts.entityId
	* @param {number} opts.ceilId - entity id for the ceil boat entity
	* @param {number} opts.height - in blocks
	* @param {number} opts.x
	* @param {number} opts.y
	* @param {number} opts.z
	* @param {number} opts.currentFloor
	* @param {Floor[]} opts.floors - mandatory
	* @param {boolean} opts.canUnpress - can you unpress a button from the queue
	* @param {number} opts.stopTime - how long in ms will the elevator wait before going to the next requested floor?
	*/
	constructor(opts = {}){
		this.UUID = UUIDS.v1();
		this.ceilUUID = UUIDS.v1();
		this.bossbar = new BossBar({
			UUID: UUIDS.v1(),
			color: 1,
			title: [new Msg("Asansör", "blue")],
			loaded: false,
			...(opts.bossbar || {}),
		});
		this.entityId = opts.entityId || Math.floor(Math.random() * 10000000);
		this.ceilId = opts.ceilId || Math.floor(Math.random() * 10000000);
		this.height = opts.height || 3;
		this.x = opts.x || Math.floor(clientPosition.x) + 0.5;
		this.y = opts.y || Math.floor(clientPosition.y);
		this.z = opts.z || Math.floor(clientPosition.z) + 0.5;
		
		this.chunkPos = [Math.floor(Math.round(this.x) / 16), Math.floor(Math.round(this.z) / 16)];
		this.loaded = false;
		if(loadedChunks.has(this.chunkPos.join(";"))) this.sendPacket();
		
		this.currentFloor = opts.currentFloor || 0;
		this.floorQueue = new Set();
		this.floors = opts.floors || [new Floor({
			y: this.y,
			index: 0,
		})];
		this.floors = this.floors.map(f => {
			if(typeof f == "number"){
				return new Floor({ y: f, });
			} else {
				return (f instanceof Floor ? f : new Floor(f));
			};
		});
		this.canUnpress = opts.canUnpress || false;
		this.busy = opts.busy || false;
		this.stopTime = opts.stopTime || 5000;
		
		this.qDecideWhenNotBusy = false;
		this.qDirection = "none";
		elevatorList[this.entityId] = this;
	};
	
	/**
	* Is the client near the elevator?
	* @returns {boolean}
	*/
	isNear(){
		return (Math.abs(this.x - clientPosition.x) < 2 && Math.abs(this.z - clientPosition.z) < 2);
	};
	
	/* Packets */
	sendBossBar(){
		// probs switch to Y value percentage instead of floors.length and currentFloor
		let calcHealth = () => percentage(this.currentFloor, this.floors.length-1) / 100;
		this.bossbar.sendPacket(calcHealth());
	};
	unloadBossBar(){
		this.bossbar.unload();
	};
	sendPacket(){
		if(this.loaded) {
			writeAll("entity_teleport", {
				entityId: this.entityId,
				x: this.x,
				y: this.y-0.5,
				z: this.z,
				pitch: 0,
				yaw: 0,
				onGround: true,
			});
			
			writeAll("entity_teleport", {
				entityId: this.ceilId,
				x: this.x,
				y: this.y+this.height-0.5,
				z: this.z,
				pitch: 0,
				yaw: 0,
				onGround: true,
			});
			
			if(this._y < this.y && this.isNear()) {
				this.moveClient(this.y - this._y);
			};
			this._y = this.y;
		} else {
			writeAll("spawn_entity", {
				type: this.type || 1,
				entityId: this.entityId,
				x: this.x,
				y: this.y-0.5,
				z: this.z,
				objectUUID: this.UUID,
				velocityX: 0,
				velocityY: 0,
				velocityZ: 0,
				pitch: 0,
				yaw: 0,
				objectData: 0,
			});
			writeAll("spawn_entity", {
				type: this.type || 1,
				entityId: this.ceilId,
				x: this.x,
				y: this.y+this.height-0.5,
				z: this.z,
				objectUUID: this.ceilUUID,
				velocityX: 0,
				velocityY: 0,
				velocityZ: 0,
				pitch: 0,
				yaw: 0,
				objectData: 0,
			});
			this.loaded = true;
			this._y = this.y;
		};
	};
	
	/* Controller */
	pressButton(n, local=true){
		//this.floorQueue.add(n);
		//if(local) this.qDecide();
		if(isNaN(Number(n))) return 0;
		if(this.currentFloor == n) return 2;
		if(this.busy){
			this.floorQueue.add(Number(n));
		} else {
			this.floorQueue.add(Number(n));
			this.goToFloor(Number(n));
		};
		return 1;
	};
	/*
	qDecide(){
		if(this.busy) return this.qDecideWhenNotBusy = true;
		if(this.floorQueue.size == 0) return;
		
		let floor = [...this.floorQueue].sort((a, b) => a - b).filter((i) => {
			if(this.qDirection == "none") return true;
			if(this.qDirection == "up" && this.currentFloor < i) return true;
			if(this.qDirection == "down" && this.currentFloor > i) return true;
			return false;
		})[0];
		this.qDirection = (this.floors[floor].y > this.y ? "up" : "down");
		this.goToFloor(floor);
	};*/
	
	
	/**
	* Send the buttons
	*/
	sendControls(){
		
		if(this.lastControl !== undefined && this.lastControl + 1000 > Date.now()) return;
		this.lastControl = Date.now();
		let list = [];
		
		this.floors.forEach((floor, i) => {
			let pressed = this.floorQueue.has(i);
			let hover = (floor.title || "Floor "+(floor.index !== undefined ? floor.index : i));
			let cmd = ".elevator press "+this.entityId+" "+i;
			list.push(
				new Msg(
					"(",
					(pressed ? "dark_green" : "dark_gray"),
					hover,
					cmd,
				),
				new Msg(
					(floor.index !== undefined ? floor.index+"" : i+""),
					(pressed ? "green" : "gray"),
					hover,
					cmd,
				),
				new Msg(
					") ",
					floor.buttonColor || (pressed ? "dark_green" : "dark_gray"), // buttonColor needs fix in floor class -den
					hover,
					cmd,
				)
			);
		});
		
		notify({
			text: "",
			extra: [
				new Msg("[P:Elevator] ", "dark_aqua"),
				...list,
			],
		});
	};
	
	/* Sounds */
	sendClickSound(n=0){
		writeAll("sound_effect", {
			x: clientPosition.x * 8,
			y: clientPosition.y * 8,
			z: clientPosition.z * 8,
			soundId: ( n == 2 ? 71 : 69),
			soundCategory: 0,
			volume: 0.5,
			pitch: 1,
		});
	};
	sendJingle(){
		writeAll("sound_effect", {
			x: clientPosition.x * 8,
			y: clientPosition.y * 8,
			z: clientPosition.z * 8,
			soundId: 78,
			soundCategory: 0,
			volume: 0.5,
			pitch: 1,
		});
		setTimeout(() => writeAll("sound_effect", {
			x: clientPosition.x * 8,
			y: clientPosition.y * 8,
			z: clientPosition.z * 8,
			soundId: 78,
			soundCategory: 0,
			volume: 0.5,
			pitch: 0.8,
		}), 750);
	};
	sendJingleMove(){
		writeAll("sound_effect", {
			x: clientPosition.x * 8,
			y: clientPosition.y * 8,
			z: clientPosition.z * 8,
			soundId: 73,
			soundCategory: 0,
			volume: 0.5,
			pitch: 1,
		});
	};
	
	/* Movement */
	moveClient(blocks=0){
		writeAll("entity_effect", {
			entityId: userEntityId,
			duration: 3,
			effectId: 25,
			amplifier: blocks,
			hideParticles: 0,
		});
		setTimeout(function(){
			writeAll("remove_entity_effect", {
				entityId: userEntityId,
				effectId: 25,
			});
		}, blocks * 1000);
	};
	setY(pos){
		this.y += pos;
		this.sendPacket();
	};
	/** Go to a floor :p */
	goToFloor(n){
		if(!this.floors[n]) return;
		if(this.currentFloor == n) return;
		clearInterval(this.interval);
		this.sendJingleMove();
		let floor = this.floors[n];
		let y = floor.y;
		let speed = 1000;
		this.busy = true;
		
		let cb = () => {
			if(this.isNear()) makeSubtitle(floor.makeMsg());
			this.busy = false;
			this.floorQueue.delete(n);
			if(this.floorQueue.size != 0) setTimeout(() => {
				this.goToFloor(Array.from(this.floorQueue)[0]);
			}, this.stopTime);
			this.currentFloor = n;
			this.sendJingle();
		};
		
		if(this.y < y){
			// up
			this.interval = setTimedInterval(() => this.setY(1), speed, Math.floor(y - this.y + 1) * speed, cb);
		} else {
			// down
			this.interval = setTimedInterval(() => this.setY(-1), speed, Math.floor(this.y - y + 1) * speed, cb);
		};
	};
	floorUp(){
		this.goToFloor(this.currentFloor+1);
	};
	floorDown(){
		this.goToFloor(this.currentFloor-1);
	};
	stop(){
		clearInterval(this.interval);
	};
};




function setTimedInterval(func, intervalTime, timeoutTime, cb){
	let interval = setInterval(func, intervalTime);
	setTimeout(() => {
		clearInterval(interval);
		if(cb) cb();
	}, timeoutTime);
	return interval;
};





const Commands = new Map();
const CommandCategories = new Map();
function addCommand(data){
	Commands.set(data.name, data);
	if(data.aliases) data.aliases.forEach(alias => Commands.set(alias, {
		...data,
		isAlias: true,
	}));
	
	let c = data.category || "Diğer";
	if(CommandCategories.has(c)) {
		CommandCategories.set(c, [...CommandCategories.get(c), data.name]);
	} else {
		CommandCategories.set(c, [data.name]);
	};
};
function bindCommands(client){
	client.on("chat", async function({ message }){
		if(!message) return;
		let __autoSavePassCmds = ["/login", "/register", "/giriş", "/kaydol"];
		if(config.autoSavePasswords && (_client && _client.host) && (__autoSavePassCmds.includes(message))) {
			boot("addPassword", _client.host+":"+_client.username+":"+message.split(" ")[1]);
		};
		
		if(!message.startsWith(Prefix)) return;
		let args = message.split(" ");
		let cmd = args[0].replace(Prefix, "").toLowerCase();
		args[0] = "";
		
		if(!Commands.has(cmd)) return;
		let c = Commands.get(cmd);
		function r(value, i, parent){
			if(typeof value == "function") {
				value(args);
			} else if(typeof value == "object") {
				let x = value[args[i]] || value.none;
				if(typeof x == "string") x = value[x];
				if(!x) return console.log("COMMAND ERR!! DEBUG=", value, i, parent, args, x);
				r(x, i + 1, value);
			} else {
				if(value && value.none) value.none(args);
			};
		};
		r(c.run, 1, c.run);
	});
	
	
	addCommand({
		name: "help",
		aliases: ["yardım", "komutlar", "commands"],
		run: (args) => {
			let p = new Msg("[i] ", "dark_aqua");
			if(args[1]) {
				let cname = args[1];
				
				if(["kategori", "category", "categories", "kategoriler"].includes(cname.toLowerCase())) return wChat(client, {
					text: "",
					extra: [p, new Msg("Categories: ", "blue"), Array.from(CommandCategories.keys()).join(", ")],
				});
				
				if(Commands.has(cname)) {
					let c = Commands.get(cname);
					wChat(client, {text:"",
						extra: [
							p, new Msg("Command: ", "blue"), c.name, "\n",
							p, (c.aliases ? new Msg("Aliases: ", "blue") : ""), (c.aliases ? "'"+c.aliases.join("', '")+"'" : ""), "\n",
							p, (c.desc ? new Msg("Desc.: ", "blue") : ""), (c.desc ? c.desc : ""), "\n",
							p, (c.category ? new Msg("Category: ", "blue") : ""), (c.category ? c.category : ""), "\n",
							p, (c.usage ? new Msg("Usage: ", "blue") : ""), (c.usage ? Prefix + c.usage : ""), "\n",
						],
					});
				} else if(CommandCategories.has(cname)) {
					wChat(client, {
						text: "",
						extra: [
							p, cname, new Msg(" commands: ", "blue"), CommandCategories.get(cname).join(", "),
						],
					});
				} else {
					wChat(client, [p, cname, new Msg(" command or category not found.", "gray")]);
				};
			} else {
				wChat(client, {text:"",
				extra:[
						p, new Msg("Commands:\n", "blue"),
						Array.from(Commands.keys()).filter(name => !Commands.get(name).isAlias).join(", "), "\n",
						p, new Msg("For command info ", "blue"), ".help <cmd/category>",
					],
				});
			};
		},
	});
	
	
	
	
	
	
	
	
	
	
	addCommand({
		name: "copy",
		aliases: ["kopyala"],
		desc: "Copies text.",
		category: "util",
		usage: "copy <Yazı>",
		run: (args) => {
			let text = args.join(" ").trim();
			if(0 == text.length) return notify("Usage: .copy <text>");
			clip.writeSync(text);
		},
	});
	
	addCommand({
		name: "spammer",
		aliases: ["spam"],
		category: "util",
		usage: "spammer",
		run: {
			none: (args) => {
				notify("Spammer komutları: ( start, stop, msg, delay )");
			},
			start: (args) => {
				chat.spammer.start();
				notify("> Spammer başlatıldı");
			},
			"başlat": "start",
			stop: (args) => {
				chat.spammer.stop();
				notify("> Spammer durduruldu");
			},
			durdur: "stop",
			msg: (args) => {
				if(!args[2]) {
					let msg = chat.spammer.message;
					notify("Spammer mesajı:");
					notify(msg, "light_gray");
				} else {
					chat.spammer.message = args.slice(2).join(" ");
					notify("> Spammer mesajı değiştirildi.");
				};
			},
			message: "msg",
			mesaj: "msg",
			delay: (args) => {
				if(!args[2]) {
					let sn = chat.spammer.delay / 1000;
					notify([new Msg("Spammer hızı: ", "gray"), new Msg(sn, "light_gray"), new Msg(" saniye.", "gray")]);
				} else {
					chat.spammer.setDelay(args[2]);
					notify([new Msg("> Spammer hızı, ", "gray"), new Msg(args[2], "light_gray"), new Msg("ms olarak ayarlandı.", "gray")]);
				};
			},
			"hız": "delay",
		},
	});
	
	addCommand({
		name: "send",
		category: "packets",
		desc: "nosend komutunun efektlerini kaldırır",
		usage: "send",
		run: (args) => {
			disallow.sendAll = true;
			notify("Paketler yeniden gönderiliyor.");
		},
	});
	
	addCommand({
		name: "nosend",
		desc: "Paket göndermez. Blok kırarsanız veya başka birşey yaparsanız kimse görmez.",
		category: "packets",
		usage: "nosend",
		run: (args) => {
			disallow.sendAll = false;
			notify("Artık paket gönderilmiyor. (.send ile düzeltin)");
		},
	});
	
	addCommand({
		name: "dc",
		category: "main",
		desc: "Sunucudan çıkar ve menüye atar.",
		usage: "dc",
		run: () => {
			if(_client) {
				notify("Kapatılıyor...");
				_client.end();
				_client = null;
			} else {
				notify("Bağlantı Kesilemedi - Bağlantı yok.");
			};
		},
	});
	
	addCommand({
		name: "forcegm",
		category: "util",
		desc: "Sizin için oyun modunuzu değiştirir.",
		usage: "forcegm <0, 1, 2 yada 3>",
		run: (args) => {
			let gm = Number(args[1]);
			if(isNaN(gm)) return notify("Kullanım: .forcegm <0, 1, 2 yada 3>");
			client.write("game_state_change", { reason: 3, gameMode: gm });
		},
	})
	
	addCommand({
		name: "eval",
		category: "util",
		desc: "Javascript çalıştırır. Dikkatli ol.",
		usage: "eval",
		run: (args) => {
			try {
				let out = eval(args.join(" "));
				let t = util.inspect(out);
				t = undefined===t ? t = "undefined" : t;
				wChat(client, [{text:"",extra:[{text:"eval>> ",color:"aqua"},{text:t,color:"light_gray"}]}]);
			} catch(err){
				notify("Eval hatası: "+err.toString());
			}
		},
	});
	
	
	
	addCommand({
		name: "getmap",
		desc: "ID'si olan bir harita/ekran verir (sol elinize)",
		usage: "getmap",
		run: (args) => {
			let id = args[1] || 0;
			writeAll("set_slot", {
				windowId: 0,
				slot: 45,
				item: {
					blockId: 358,
					itemCount: 1,
					itemDamage: id,
				},
			});
		},
	});
	
	
	
	
	let __fl0 = function(){
		writeAll("remove_entity_effect", {
			entityId: userEntityId,
			effectId: 25,
		});
	};
	let __fl1 = function(pwr=0, dur=3){
		writeAll("entity_effect", {
			entityId: userEntityId,
			duration: dur,
			effectId: 25,
			amplifier: pwr,
			hideParticles: 0,
		});
	};
	addCommand({
		name: "flight",
		aliases: ["uçuş", "fl"],
		desc: "Uçuş kontrolleri",
		usage: "flight",
		run: {
			none: () => {
				notify({
					text: "",
					extra: [
						new Msg("[P] ", "aqua"),
						new Msg("(✖)", "red", new Msg("> Durdur", "gray"), ".flight stop"), " ",
						new Msg("(▲)", "green", new Msg("> Fırlat", "gray"), ".flight launch"), " ",
						new Msg("(Δ)", "blue", new Msg("> Yükselmeye başla ve durma", "gray"), ".flight start"), " ",
					],
				});
			},
			stop: () => {
				__fl0();
			},
			launch: () => {
				__fl1(30);
				setTimeout(__fl0, 5000);
			},
			start: () => {
				__fl1();
			},
		},
	});
	
	addCommand({
		name: "chat",
		category: "WS",
		desc: "WS ile bir mesaj gönderir",
		usage: "chat <mesaj>",
		run: (args) => {
			if(socket && socket.connected) {
				socket.emit("sendMessage", makeAuth(), activeRoom, args.join(" ").trim());
			} else {
				notify("WS bağlı değil!");
			};
		},
	});
	
	addCommand({
		name: "room",
		category: "WS",
		desc: "Aktif roomu değiştirir",
		usage: "room [room ismi]",
		run: (args) => {
			let room = args[1];
			if(!room || room.length == 0) {
				notify("Aktif room: "+activeRoom);
			} else {
				if(socket && socket.connected) {
					socket.emit("myRooms", function(rooms){
						if(rooms.includes(room)){
							activeRoom = room;
							notify("Aktif room değiştirildi");
						} else {
							notify("Bu room'da değilsiniz");
						};
					});
				} else {
					notify("WS bağlı değil!");
				};
			};
		},
	});
	
	addCommand({
		name: "rooms",
		category: "WS",
		desc: "Katıldığın room'ları listeler",
		usage: "rooms",
		run: () => {
			if(socket && socket.connected) {
				socket.emit("myRooms", function(rooms){
					notify("Katıldığın roomlar: "+rooms.join(", "));
				});
			} else {
				notify("WS bağlı değil!");
			};
		},
	});
	
	addCommand({
		name: "join",
		category: "WS",
		desc: "Bir room'a katılma komutu",
		usage: "join <room ismi>",
		run: (args) => {
			let room = args[1];
			if(!room || room.length == 0) {
				notify("Kullanım: "+Prefix+"join <room ismi>");
			} else {
				if(socket && socket.connected) {
					socket.emit("joinRoom", room);
				} else {
					notify("WS bağlı değil!");
				};
			};
		},
	});
	
	addCommand({
		name: "wss",
		category: "WS",
		desc: "Kullanmayın",
		run: (args) => {
			if(!args[1]) return;
			socketHost = args.slice(1).join(".");
			socket.removeAllListeners();
			socket.disconnect();
			socket = null;
			setupWS();
			socket.once("connect", () => notify("WS bağlanıldı"))
		},
	});
	
	
	addCommand({
		name: "me",
		category: "Chat",
		desc: "Mesajlarınızı *bu şekilde* yapar",
		run: (args) => {
			_client.write("chat", { message: "*"+args.join(" ").trim()+"*" });
		},
	});
	
	addCommand({
		name: "spaced",
		category: "Chat",
		desc: "Mesajlarınızı boşluklu yapar, örn: b a n a n a",
		run: (args) => {
			_client.write("chat", { message: args.join(" ").trim().split("").join(" "), });
		},
	});
	
	addCommand({
		name: "sarcastic",
		category: "Chat",
		desc: "sArCaStİc tExT",
		aliases: ["s"],
		run: (args) => {
			let m = args.join(" ").trim();
			let i = true;
			m = m.split("").map(c => {
				i = !i;
				return (i ? c.toLowerCase() : c.toUpperCase());
			}).join("");
			_client.write("chat", { message: m, });
		},
	});
	
	
	function getMusicString(song){
		return [
			new Msg("Şarkı ismi: ", "white"), new Msg(song.title || "Başlıksız", "gold"), "\n",
			new Msg("Besteleyen: ", "white"), new Msg(song.author || "Bilinmiyor", "gold"), "\n",
			new Msg("Açıklama: ", "white"), new Msg(song.description || "Yok", "gold"), "\n",
			new Msg("Orjinal Besteci: ", "white"), new Msg(song.original_author || "Bilinmiyor/Yok", "gold"), "\n",
			new Msg("Import: ", "white"), new Msg(song.imported_name|| "Hayır", "gold"), "\n",
			new Msg("Tempo: ", "white"), new Msg(song.tempo+"/tps", "gold"),
		];
	};
	
	addCommand({
		name: "music",
		category: "media",
		desc: "Müzik Oynatıcısı",
		usage: "music",
		aliases: ["m", "müzik"],
		run: {
			none: () => {
				let s = "   ";
				if(songPlayer.song) {
					s = new Msg("(♬)", "green", [new Msg("Şuan çalan şarkı:\n\n"), ...getMusicString(songPlayer.song)]);
				};
				notify({
					text: "",
					extra: [
						new Msg("[P] ", "aqua"),
						s, " ",
						new Msg("(►)", "blue", new Msg("> Şarkı oynat (İsmini yada dosya yolunu yazın)\nÖrnek: .music play Flower_Dance", "gray"), null, ".music play "), " ",
						new Msg("(☄)", "gold", new Msg("> Şarkıları listele", "gray"), ".music list"), " ",
						new Msg("(✖)", "red", new Msg("> Durdur", "gray"), ".music stop"), " ",
					],
				});
			},
			play: (args) => {
				if(!args[2]) return notify("Kullanım: "+Prefix+"music play <şarkı (.nbs) adı>");
				let FN = args.slice(2).join(" ").trim();
				try {
					let src = (fs.existsSync(FN) ? FN : "./songs/"+(FN.endsWith(".nbs") ? FN : FN + ".nbs"));
					if(!fs.existsSync(src)) {
						let list = (fs.readdirSync("./songs") || []).filter(fn => fn.endsWith(".nbs")).map(fn => fn.replace(".nbs", ""));
						let result;
						list.forEach(item => {
							if(item.toLowerCase().replace(/_/g, " ") == FN.toLowerCase().replace(/_/g, " ")) result = item;
						});
						if(!result) return notify("Müzik bulunamadı: "+FN);
						src = "./songs/" + result + ".nbs";
					};
					songPlayer.play(src);
					songPlayerBossBar.setTitle({
						text: "",
						extra: [new Msg("♬", "dark_gray"), " Şuan çalıyor: ", new Msg((songPlayer.song.title || src), "gold")],
					});
					songPlayer.lastplayed = src;
				} catch(e) {
					notify("playsong: Hata: "+e.toString());
				};
			},
			replay: () => {
				if(songPlayer.lastplayed) songPlayer.play(songPlayer.lastplayed);
			},
			stop: () => {
				songPlayer.stop();
			},
			info: () => {
				if(!songPlayer.song) return notify("Şuan müzik çalmıyor");
				notify({
					text: "",
					extra: [new Msg("[P] ", "aqua"), new Msg("Şuan çalan müzik: ", "gray"), new Msg(songPlayer.song.title, "green", getMusicString(songPlayer.song))],
				});
			},
			list: () => {
				if(!fs.existsSync("./songs")) fs.mkdirSync("./songs");
				let list = (fs.readdirSync("./songs") || []).filter(fn => fn.endsWith(".nbs")).map(fn => fn.replace(".nbs", ""));
				let text = [
					new Msg(" --- Şarkı Listesi ---\n\n", "dark_aqua"),
					(list.length != 0 ? new Msg(list.join("\n"), "gold") : new Msg("<şarkı yok>", "white")),
					new Msg("\n\n 'songs' ", "white"),
					new Msg("klasörüne ", "gray"),
					new Msg("nbs ", "light_gray"),
					new Msg("dosyası\n ekleyerek şarkı ekleyebilirsiniz", "gray"),
				];
				notify({
					text: "",
					extra: [new Msg("[P] ", "aqua"), new Msg("Şarkı listesi", "light_gray", text), new Msg(" (farenizi üstüne getirin)", "gray")],
				});
			},
			wsplay: (args) => {
				if(!socket || !socket.connected) return notify("WS bağlı değil!");
				if(!args[2]) return notify("Kullanım: "+Prefix+"music wsplay <şarkı (.nbs) adı>");
				try {
					let song = NBS.loadSong(fs.existsSync(args[2]) ? args[2] : "./songs/"+(args[2].endsWith(".nbs") ? args[2] : args[2] + ".nbs"));
					let noNote = JSON.parse(JSON.stringify(song));
					noNote.layers = {};
					socket.emit("playSongInfo", makeAuth(), activeRoom, noNote, function(allowed, reason){
						if(allowed) {
							wsSongPlayer.Room = activeRoom;
							wsSongPlayer.play(song);
						} else {
							notify("Oynatılamadı: "+reason);
						};
					});
				} catch(e) {
					notify("playsong: Hata: "+e.toString());
				};
			},
			wstop: () => wsSongPlayer.stop(),
			oynat: "play",
			p: "play",
			s: "stop",
			l: "list",
			i: "info",
			wsp: "wsplay",
		},
	});
	
	
	addCommand({
		name: "elevator",
		desc: "Asansör Komutları (beta)",
		aliases: ["elev"],
		run: {
			none: () => {},
			local: {
				create: () => {},
				delete: () => {},
				addfloor: () => {},
				remfloor: () => {},
			},
			create: () => {},
			delete: () => {},
			addfloor: () => {},
			remfloor: () => {},
			press: (args) => {
				let id = args[2];
				let n = args[3];
				if(!id || !n || !elevatorList[id]) return;
				let o = elevatorList[id].pressButton(n);
				elevatorList[id].sendClickSound(o);
				setTimeout(() => elevatorList[id].sendControls(), 0);
			},
		},
	});
	
	
	
	addCommand({
		name: "npc",
		desc: "NPC Komutları (Tamamlanmadı)",
		run: (args) => {
			
		},
	});
	
	
	
	
	addCommand({
		name: "npchere",
		desc: "NPC Spawnlar. (BETA)",
		run: (args) => spawnNPC({
			name: args[1],
			x: clientPosition.x,
			y: clientPosition.y,
			z: clientPosition.z,
			id: Math.floor(Math.random()*1000),
		}),
	});
	
	
	
	addCommand({
		name: "vplayjson",
		desc: "deneysel",
		usage: "vplayjson <map id> <json dosya yolu...>",
		run: (args) => {
			let fps = 10;
			if(!args[2]) return notify("Geçersiz komut argümanları");
			let displays = {
				x: 1,
				y: 1,
				ids: [ args[1] || 542 ],
			};
			let fn = args.slice(2).join(" ").trim();
			if(!fs.existsSync(fn)) return notify("404 File not found");
			let FRAMES = JSON.parse(fs.readFileSync(fn)).slice(1).map(f => Buffer.from(f, "hex"));
			let time = 0;
			let end = () => {
				clearInterval(interval);
				notify("vplayjson ended");
			};
			let interval = setInterval(() => {
				if(!FRAMES[time]) return end();
				let mapID = displays.ids[0];
				sendMapArt(mapID, FRAMES[time]);
				time++;
			}, 1000/fps);
		},
	});
	
	
	addCommand({
		name: "dlvjson",
		run: (args) => {
			if(!args[1]) return notify("Geçersiz komut argümanları");
			const res = await fetch(args[1]);
			const fileStream = fs.createWriteStream("./"+(args[2] || "video_"+Math.floor(Math.random() * 1000000000)));
			res.body.pipe(fileStream);
			res.body.on("error", (err) => {
				console.log("Örnek müzik indirme hatası: "+err.toString());
			});
			fileStream.on("finish", function() {
				console.log("Örnek müzik indirildi: "+song.filename);
			});
		},
	});
	
	
	
};

function makeAuth(){
	return {
		realnick: realUserNick,
		nick: currentUsername || realUserNick,
		serverip: connectedServer,
	};
};

function setupWS(newhost){
	if(newhost) socketHost = newhost;
	socket = io(socketHost+"?auth=null");
	socket.on("connect", function(){
		console.log(chalk.cyan("[Plasma-WS] ")+chalk.gray("Bağlantı Kuruldu!"));
		if(connectedServer) socket.emit("joinServer", connectedServer);
		if(realUserNick) socket.emit("setRealNick", realUserNick);
		socket.emit("VERSION", version);
	});
	socket.on("writeClient", function(name, data){
		writeAll(name, data);
	});
	socket.on("writeTargetClient", function(name, data){
		if(_client) _client.write(name, data);
	});
	socket.on("channelJoined", function(channel){
		console.log(chalk.magenta("[WS] ")+channel+chalk.gray(" kanalına katıldınız."));
	});
	socket.on("recieveMessage", function(room, user, msg){
		let component = {
			text: "",
			extra: [
			{
				text: "[P] ",
				color: "aqua"
			},
			{
				text: "{"+room+"} ",
				color: "dark_gray",
				hoverEvent: {
					action: "show_text",
					value: new Msg("Aktif room'u "+room+"'ya almak için tıkla"),
				},
				clickEvent: {
					action: "suggest_command",
					value: Prefix+"room "+room,
				},
			},
			{
				text: user.realnick+": ",
				color: "gray",
				hoverEvent: {
					action: "show_text",
					value: [
						new Msg(" [Kullanıcı Bilgisi] \n", "gray"), 
						new Msg("Sunucu: ", "white"), new Msg(user.serverip+"\n", "gold"),
						new Msg("Oyun içi nick: ", "white"), new Msg(user.nick+"\n", "gold"),
						//new Msg("Kullanıcı IDsi: ", "white"), new Msg(user.id+"\n", "gold"),
					],
				},
			},
			{
				text: msg,
				color: "white",
			}
			],
		};
		component.extra[3] = buttonify(component.extra[3], 3, component.extra);
		notify(component);
	});
	socket.on("recieveSystemMessage", function(comps){
		let component = {
			text: "",
			extra: [
			{
				text: "[P] ",
				color: "aqua"
			},
			...comps,
			],
		};
		notify(component);
	});

	socket.on("video", function(mapID, data, chunk){
		//if(chunk && !loadedChunks.has(chunk)) return; // not loaded
		sendMapArt(mapID, data);
		//console.log("frame map"+mapID+" data:", data);
	});
	socket.on("playSong", function(song){
		songPlayer.play(song);
	});
	socket.on("stopSong", function(){
		songPlayer.stop();
	});
	socket.on("playNote", function(packet){
		songPlayer._note(packet);
	});
	
	socket.on("init_elevator", function(data){
		let elev = new Elevator(data);
	});
	socket.on("elevator_move", function(id, floor){
		if(!elevatorList[id]) return;
		elevatorList[id].goToFloor(floor);
	});
	//socket.on("");
	
	socket.on("spawnNpc", function(name, pos, id=Math.floor(Math.random()*10000)){
		spawnNPC({
			name,
			...pos,
			id,
		})
	});
	socket.on("connect_error", function(err){
		if(err.message == "xhr poll error") return;
		console.log(chalk.cyan("[Plasma-WS] ")+chalk.red("Hata: ")+err.message);
	});
};

setupWS();





// EOF: