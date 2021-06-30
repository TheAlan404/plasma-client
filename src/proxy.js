/* Plasma Client | Proxy */

const mc = require("minecraft-protocol");
const illegalPackets = ["keep_alive", "login"];
const mainFilter = (client, target, data, meta) => !illegalPackets.includes(meta.name) && !([meta.state, client.state, target.state].filter(x => x !== "play").length);

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
		let target = this.createClient({ host, port, username }, true);

		client._proxycb = (data, meta) => this._pass.bind(this)(client, target, data, meta);
		client.on("packet", client._proxycb);

		target._proxycb = (data, meta) => this._pass.bind(this)(target, client, data, meta);
		target.on("packet", target._proxycb);
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
	_pass(client, target, data, meta){
		if(mainFilter(client, target, data meta)) return;
		let route = client.isServer ? "send" : "recieve";
		if(this.filter[route+"All"] === false) return;
		if(this.filter[route].has(meta.name)) {}; // TODO
		target.write(meta.name, data);
	};
};

module.exports = {
	Proxy,
};
