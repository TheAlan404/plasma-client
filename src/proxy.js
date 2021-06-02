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
	};
	
};

module.exports = {
	Proxy,
};