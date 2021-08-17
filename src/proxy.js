/* Plasma Client | Proxy */

const mc = require("minecraft-protocol");
const Msg = require("@Msg");
const { EventEmitter } = require("events");
const illegalPackets = ["keep_alive", "login", "success"];
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
		this.label = data.label ?? null;
	};
	
	/**
	* Stringifies a filter
	* @param {string} route - 'send'|'recieve'
	* @param {string} name - packet name
	* @param {ProxyFilter} filter
	* @return {string}
	*/
	static toString(route, name, filter){
		return `Filter<${route}:${name}>(${filter.type})`; /// @example 'Filter<send:chat>(DENY)'
	};
	
	/**
	* Stringifies the filter as a minecraft chat component
	* @param {ProxyFilter} filter
	* @param {object} [opts] - formatting options
	* @param {Msg} [opts.SEP] - seperator
	* @param {string} [opts.filterColors] - mc color
	* @return {Msg[]} chatComponent
	*/
	static toChat(filter, opts = {}){
		const {
			SEP = new Msg(":", "white"),
			filterColors = ({
				READ: "green",
				MODIFY: "blue",
				DENY: "red",
			}),
			labelSEP = new Msg(" => ", "white"),
		} = opts;
		let comp = [new Msg(name, "gray"), SEP, new Msg(filter.type, filterColors[filter.type])];
		if(filter.label) comp.push(labelSEP, new Msg("'" + filter.label + "'"));
		return comp;
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
	    fn = typeof fn === "function" ? fn : ((data) => {
	        console.log(`[ProxyFilter => Read${typeof fn === "string" ? ` / ${fn}` : ""}]`, data);
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

class Proxy extends EventEmitter {
	constructor(plasma){
		super();
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
		
		this.entityPosition = { x: 0, y: 0, z: 0 };
		this.addFilter("send", "position", new ProxyFilter({
			type: "READ",
			filter: (data) => {
				this.entityPosition.x = data.x;
				this.entityPosition.y = data.y;
				this.entityPosition.z = data.z;
				this.emit("positionChanged", this.entityPosition);
			},
			label: "plasma entityPosition",
		}));
		
		plasma.ProxyFilter = ProxyFilter;
	};
	connect(client, opts = {}){
		const { host = "localhost", port = 25565, username = (this.nick || client.username) } = opts;
		console.log(`[Proxy] Connecting to '${host}${port === 25565 ? "" : `:${port}`}' with username '${username}'...`);
		let target = this.createClient({ host, port, username }, true);

		client._proxycb = (data, meta) => this._pass.bind(this)(client, target, data, meta);
		client.on("packet", client._proxycb);

		target._proxycb = (data, meta) => this._pass.bind(this)(target, client, data, meta);
		target.on("packet", target._proxycb);
	};
	/**
	* Set the nick of the proxy
	* @param {string} username
	*/
	setNick(username){
		this.nick = username;
	};
	
	/**
	* Create a new client
	* @param {object} opts - mc protocol createClient options
	* @param {boolean} [setAsCurrent=true] - sets this client as the current one
	* @param {boolean} [detached=false] - if true, dont save the client to proxy.targetClients
	*/
	createClient(opts = {}, setAsCurrent = true, detached = false){
		opts.version = opts.version ?? "1.12.2";
		let client = mc.createClient(opts);
		let id = this.targetClients.size;
		client.proxyid = id;
		// to store proxy/client data
		client.proxy = {};
		client.on("login", () => console.log(`[Proxy] client(${id}) is logged in`));
		if(!detached) this.targetClients.set(id, client);
		if(setAsCurrent) this.targetClient = client;
		this.attachTargetListeners(client);
		return client;
	};
	
	attachTargetListeners(client){
		client.chat = (str) => client.write("chat", { message: str });
		
		if(!client.proxy) client.proxy = {};
		client.proxy.UUIDtoNick = new Map(); // Map<UUID => string>
		client.proxy.playerList = new Set(); // Set<string>
		client.on("player_info", (packet) => {
			packet.data.forEach((item) => {
				if(packet.action === 0) {
					client.proxy.UUIDtoNick.set(item.UUID, item.name);
					client.proxy.playerList.add(item.name);
				};
				if(packet.action === 4) {
					client.proxy.playerList.delete(client.proxy.UUIDtoNick.get(item.UUID));
				};
			});
		});
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
	
	// Private/Internal Methods
	_pass(client, target, data, meta){
		if(!mainFilter(client, target, data, meta)) return;
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
