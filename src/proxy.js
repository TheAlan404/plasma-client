/* Plasma Client | Proxy */

const mc = require("minecraft-protocol");
const illegalPackets = ["keep_alive", "login"];
const mainFilter = (client, target, data, meta) => !illegalPackets.includes(meta.name) && !([meta.state, client.state, target.state].filter(x => x !== "play"));

/**
* @typedef {function|boolean} ProxyFilterItem
* If it is a function, return an object for transforming the packet.
* If you dont return an object, it will function the same as putting `true` - which doesnt proxy the packet
*/

class Proxy {
	constructor(plasma){
		this.plasma = plasma;
		this.filter = {
			send: new Map(),
			sendAll: true,
			recieve: new Map(),
			recieveAll: true,
		};
		this.targetClient = null;
		this.targetClients = new Map();
		this.nick = null;
	};
	connect(client, opts = {}){
		const { host = "localhost", port = 25565, username = (this.nick || client.username) } = opts;
		this.createClient({ host, port, username }, true);
		
	};
	setNick(username){
		this.nick = username;
	};
	createClient(opts = {}, setAsCurrent = true, detached = false){
		let client = mc.createClient(opts);
		let id = this.targetClients.size;
		client.proxyid = id;
		if(!detached) this.targetClients.set(id, client);
		if(setAsCurrent) this.targetClient = client;
		return client;
	};
};

module.exports = {
	Proxy,
};
