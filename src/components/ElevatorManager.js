const UUID = require("uuid");
const { ProxyFilter } = require("@Proxy");
const Msg = require("@Msg");

const P = new Msg("[P] ", "dark_aqua");

class ElevatorManager {
	constructor(plasma){
		this.plasma = plasma;
		
		this.elevators = new Map();
		
		this.plasma.proxy.addFilter("recieve", "map_chunk", new ProxyFilter({
			type: "READ",
			filter: (data) => {}, // TODO: load cached/saved elevators
			label: "plasma elevators",
		}));
		
		this.plasma.proxy.addFilter("recieve", "unload_chunk", new ProxyFilter({
			type: "READ",
			filter: (data) => {}, // TODO: unload elevator
			label: "plasma elevators",
		}));
		
		this.plasma.proxy.addFilter("send", "use_entity", new ProxyFilter({
			type: "DENY",
			filter: (data) => {}, // TODO: send elevator buttons to chat + only DENY the packet if entity is an elevator
			label: "plasma elevators",
		}));
		
		plasma.proxy.on("positionChanged", (pos) => {
			// TODO: bossbars
		});
	};
};








module.exports = { ElevatorManager, /*Elevator*/ };