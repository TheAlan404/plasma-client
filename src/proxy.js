/* Plasma Client | Proxy */

const mc = require("minecraft-protocol");
const illegalPackets = ["keep_alive", "login"];
const mainFilter = (client, target, data, meta) => !illegalPackets.includes(meta.name) && !([meta.state, client.state, target.state].filter(x => x !== "play").length);

class ProxyFilter {
	/**
	* Defines a filter item for Proxy
	* @param {Object} data
	* @param {"DENY"|"MODIFY"|"READ"} data.type - default "DENY"
	* @param {function} data.filter
	* if type is READ, the filter doesnt affect the packet handling
	* if type is DENY, filter should return `true` to accually deny the packet.
	* if type is MODIFY, filter should return the modified packet. filter can also return `false` to deny the packet.
	* default DENY function always returns true
	* default MODIFY function returns the same packet data
	* @example new ProxyFilter({ type: "DENY" });
	* @example new ProxyFilter({ type: "MODIFY", filter: (data) => {
	* 	data.y = 0;
	* 	return data;
	* }});
	*/
	constructor(data = {}){
		this.type = data.type || "DENY";
		this.filter = data.filter || (this.type == "DENY" ? (() => true) : (_=>_));
	};
};

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
