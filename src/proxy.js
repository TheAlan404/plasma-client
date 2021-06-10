/* Plasma Client | Proxy */

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
		// TODO: finish
		const { host = "localhost", port = 25565, username = (this.nick || client.username) } = opts;
		
	};
	setNick(username){
		this.nick = username;
	};
};

module.exports = {
	Proxy,
};