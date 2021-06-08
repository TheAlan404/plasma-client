/* Plasma Client | User Database */
const fs = require("fs");
const Defaults = {
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

class SimpleDB {
	constructor(path, def = Defaults){
		this.path = path;
		this._data = {};
		this.load(def);
	};
	load(def = {}){
		if(!fs.existsSync(this.path)) {
			fs.writeFileSync(this.path, JSON.stringify(def));
		};
		let raw = fs.readFileSync(this.path);
		let _data = {};
		try {
			_data = JSON.parse(raw);
		} catch(e) {
			console.log("[ERR] Corrupt config. Backing up and creating an empty one");
			fs.writeFileSync(this.path + "._old" + Date.now() + ".json", raw);
			fs.writeFileSync(this.path, JSON.stringify(def));
			_data = def;
		};
		this._data = _data;
	};
	save(){
		try {
			let raw = JSON.stringify(this._data);
			fs.writeFileSync(this.path, raw);
		} catch(e){
			console.log("[ERR] Unexpected error occurred while saving config", e);
		};
	};
	get(key){
		return this._data[key];
	};
	set(key, value){
		this._data[key] = value;
	};
};


module.exports = SimpleDB;