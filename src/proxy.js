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
	
	/**
	* Returns a DENY filter
	* @param {function} [filter] - optional
	* @returns {ProxyFilter}
	* @example plasma.proxy.addFilter("recieve", "chat", ProxyFilter.deny()); // Deny incoming chat packets
	*/
	static deny(fn = (() => true)){
	    return new ProxyFilter({
	        type: "DENY",
	        filter: fn,
	    });
	};
	
	/**
	* Returns a READ filter
	* @param {function} filter - defaults to console logging
	* @returns {ProxyFilter}
	* @example plasma.proxy.addFilter("recieve", "chat", ProxyFilter.read()); // Log all incoming chat packets
	*/
	static read(fn){
	    fn = fn ?? ((data) => {
	        console.log("[ProxyFilter => Read]", data);
	    });
	    return new ProxyFilter({
	        type: "READ",
	        filter: fn,
	    });
	};
	
	/**
	* Returns a MODIFY filter
	* @param {function} filter - return false to DENY, otherwise return the packet
	* @returns {ProxyFilter}
	* @example plasma.proxy.addFilter("send", "position", ProxyFilter.modify(pos => {
	    pos.y = 50;
	    return pos;
	})); // Set the Y to 50 everytime the client sends a position packet
	*/
	static modify(fn){
	    fn = fn ?? ((data) => data);
	    return new ProxyFilter({
	        type: "MODIFY",
	        filter: fn,
	    });
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
	/**
	* Add a filter to the proxy.
	* @param {"send"|"recieve"} route - the first letter is also accepted
	* @param {string} name - packet name
	* @param {ProxyFilter} filter
	* Note: You can combine route and name params to one string, like "send.chat"
	*/
	addFilter(route, name, filter){
	    if(!filter) {
	        filter = name;
	        let [r, n] = route.split(".");
	        route = r;
	        name = n;
	    };
	    if(typeof filter == "function") filter = ProxyFilter.deny(filter);
	    route = route[0] == "s" ? "send" : (route[0] == "r" ? "recieve" : "ERROR");
	    if(route == "ERROR") throw new Error("Route must be present!");
	    if(!this.filter[route].has(name)) this.filter[route].set(name, []);
	    this.filter[route].get(name).push(filter);
	};
	_pass(client, target, data, meta){
		if(mainFilter(client, target, data, meta)) return;
		let route = client.isServer ? "send" : "recieve";
		if(this.filter[route+"All"] === false) return;
	    let { modified, shouldSend } = this._filterCheck(client, target, data, meta, route);
		if(shouldSend) target.write(meta.name, modified || data);
	};
	_filterCheck(client, target, data, meta, route){
	    let shouldSend = true;
	    let modified;
	    let { name } = meta;
	    if(this.filter[route].has(name) && Array.isArray(this.filter[route].get(name))) {
	        let args = [data];
	        for(let filter of this.filter[route].get(name)){
	            if(filter.type == "READ") {
	                filter.filter(...args);
	                continue;
	            };
	            if(filter.type == "DENY") {
	                let value = filter.filter(...args);
	                if(value === true) shouldSend = false;
	                continue;
	            };
	            if(filter.type == "MODIFY"){
	                modified = filter.filter(...args);
	                if(modified === false) shouldSend = false;
	                continue;
	            };
	        };
	    };
	    return { modified, shouldSend };
	};
};

module.exports = {
	Proxy,
	ProxyFilter,
};
