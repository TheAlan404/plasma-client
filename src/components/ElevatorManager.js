const UUID = require("uuid");
const { EventEmitter } = require("events");
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
	add(elevator){
		elevator.plasma = this.plasma;
		this.elevators.set(elevator.entityId, elevator);
	};
};

const genEntityId = () => Math.floor(Math.random() * Math.pow(10, 6));
const packetNull = {
	velocityX: 0,
	velocityY: 0,
	velocityZ: 0,
	pitch: 0,
	yaw: 0,
	objectData: 0,
	onGround: true,
};

class Elevator extends EventEmitter {
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
		/*this.bossbar = new BossBar({
			color: 1,
			title: [new Msg("Elevator", "blue")],
			loaded: false,
			...(opts.bossbar || {}),
		});*/
		this.entityId = opts.entityId || genEntityId();
		this.ceilId = opts.ceilId || genEntityId();
		this.height = opts.height || 3;
		this.x = opts.x;
		this.y = opts.y;
		this.z = opts.z;
		this.oldY = this.y;
		
		this.chunkPos = [
			Math.floor(Math.round(this.x) / 16),
			Math.floor(Math.round(this.z) / 16),
		];
		this.loaded = false;
		
		this.currentFloor = opts.currentFloor || 0;
		this.floors = (opts.floors || [
			new Floor({
				y: this.y,
				index: 0,
			}),
		]).map(f => {
			if(typeof f == "number"){
				return new Floor({ y: f });
			} else {
				return (f instanceof Floor ? f : new Floor(f));
			};
		});
		this.busy = opts.busy || false;
		this.stopTime = opts.stopTime || 5000;
	};
	
	/**
	* Determines if the given position is near the elevator
	* @returns {boolean}
	*/
	isNear(pos){
		return (Math.abs(this.x - pos.x) < 2 && Math.abs(this.z - pos.z) < 2);
	};
	
	get ceilY(){
		return this.y + this.height - 0.5;
	};
	
	sendBossBar(){
		// TODO
	};
	unloadBossBar(){
		// TODO
	};
	sendPacket(){
		if(this.loaded) {
			this.plasma.write("entity_teleport", {
				entityId: this.entityId,
				x: this.x,
				y: this.y - 0.5,
				z: this.z,
				...packetNull,
			});
			
			this.plasma.write("entity_teleport", {
				entityId: this.ceilId,
				x: this.x,
				y: this.ceilY,
				z: this.z,
				...packetNull,
			});
		} else {
			this.plasma.write("spawn_entity", {
				type: 1, // Boat
				entityId: this.entityId,
				x: this.x,
				y: this.y - 0.5,
				z: this.z,
				objectUUID: this.UUID,
				...packetNull,
			});
			
			this.plasma.write("spawn_entity", {
				type: 1,
				entityId: this.ceilId,
				x: this.x,
				y: this.ceilY,
				z: this.z,
				objectUUID: this.ceilUUID,
				...packetNull,
			});
			this.loaded = true;
		};
		if(this.oldY < this.y && this.isNear()) {
			this.moveClient(this.y - this.oldY);
		};
		this.oldY = this.y;
	};
	
	pressButton(n, local=true){
		// TODO
	};
	
	makeButtons(){
		
		// TODO: use windows for this lmao
		
		/*
		this.lastControl = Date.now();
		let list = [];
		
		this.floors.forEach((floor, i) => {
			let pressed = this.floorQueue.has(i);
			let hover = (floor.title || "Floor "+(floor.index !== undefined ? floor.index : i));
			let cmd = ".elevator press "+this.entityId+" "+i;
			return [
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
				),
			];
		});*/
	};
	
	/* Sounds */
	sendClickSound(reject = false){
		this.plasma.sendNote({
			soundId: (reject ? 71 : 69),
			soundCategory: 0,
			volume: 0.5,
			pitch: 1,
		});
	};
	sendJingle(){
		this.plasma.sendNote({
			soundId: 78,
			soundCategory: 0,
			volume: 0.5,
			pitch: 1,
		});
		setTimeout(() => this.plasma.sendNote({
			soundId: 78,
			soundCategory: 0,
			volume: 0.5,
			pitch: 0.8,
		}), 750);
	};
	sendJingleMove(){
		this.plasma.sendNote({
			soundId: 73,
			soundCategory: 0,
			volume: 0.5,
			pitch: 1,
		});
	};
	
	/* Movement */
	moveClient(blocks=0){
		this.plasma.write("entity_effect", {
			entityId: this.plasma.clientEntityId,
			duration: 3,
			effectId: 25,
			amplifier: blocks,
			hideParticles: 0,
		});
		setTimeout(function(){
			this.plasma.write("remove_entity_effect", {
				entityId: this.plasma.clientEntityId,
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






module.exports = { ElevatorManager, /*Elevator*/ };