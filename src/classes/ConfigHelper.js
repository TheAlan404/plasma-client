/* Plasma Client | Config Helper */

/*
--- A note from Dennis ---
This is idiotic and dumb. I want to die.
Please make a PR making this better. :Pain:
*/

/**
* Check if the given value is valid, and try to parse it
* The given value might be a string, in which case there is a high chance it is given by the user inside the
* config menu.
* @typedef {function} ConfigHelperTypeValidator
* @param {*} value
*/

class ConfigHelper {
	/**
	* Manages config and its types
	* @constructor
	* @param {Object} data - loaded data
	* @param {Object} types - types of fields in data
	*/
	constructor(data = {}, types = {}){
		this.data = data;
		this.types = types;
	};
	/**
	* Gets a key from config db
	* @param {string} key
	* @returns {*|null}
	*/
	get(key){
		
		return this.data[key] ?? this.types[key].default;
		
		/*if(!this.types[key]) return this.data[key] ?? null;
		if(this.data[key] === undefined) return this.types[key].default || null;
		let test = ConfigHelper.types[this.types[key].type];
		let [valid, value] = test(this.data[key]);
		if(!valid) {
			// TODO: Log with plasma
			console.log(`[ERR] Invalid value: [config.${key}] (${this.types[key]}) "${this.data[key]}"
			Reason: ${value || "No reason given"}`);
			return null;
		};
		return value;*/
	};
	
	/**
	* Sets a config value
	* @param {string} key
	* @param {string} str - the value
	* @returns {boolean} did succeed?
	*/
	set(key, str) {
		if(!this.types[key]) {
			this.data[key] = str;
			return true;
		};
		let test = ConfigHelper.types[this.types[key].type];
		let [valid, value] = test(str);
		if(!valid) return false;
		this.data[key] = str;
		if(this.save) this.save();
		return true;
	};
	
	/**
	* Set a value's type
	* @param {string} key
	* @param {string} type
	*/
	setKeyType(key, type, def = null){
		this.types[key] = { type, def };
	};
	
	/**
	* Add a custom type
	* @param {string} type
	* @param {ConfigHelperTypeValidator} validator
	*/
	static addType(type, validator){
		if(ConfigHelper.types[type]) console.warn("[ConfigHelper] Type overwritten: "+type);
		ConfigHelper.types[type] = validator;
	};
};

ConfigHelper.prototype.addType = ConfigHelper.addType;
ConfigHelper.types = {
	// ex: "hewwo"
	string: (v) => typeof v == "string" && v.trim().length ? [true, v.trim()] : [false, "Not a string or length is 0"],
	// ex: 123
	number: (v) => !isNaN(v) ? [true, Number(v)] : [false, "Not a number"],
	// ex: 31, -23, 6969
	// TODO: FIX THIS IDIOTIC LONG ASS CODE >:'c
	pos: (v) => {
		if (typeof string !== 'string')
        return [false, 'XYZ values arent given'];
		try {
			const [x, y, z] = string.match(/(\d+),(\d+),(\d+)/).slice(1);
			return [true, { x, y, z }];
		} catch {
			return [false, 'more or less than 3 fields given or a field is not a number'];
		}
	},
	// mmm not very wise
	/*typeof v == "string" ? (v.split(",").length == 3 && !v.split(",").map(n => isNaN(n)).includes(true) ? [true, {
		x: Number(v.split(",")[0]),
		y: Number(v.split(",")[1]),
		z: Number(v.split(",")[2]),
	}] : [false, "more or less than 3 fields given or a field is not a number"]) : 
	(v.x && v.y && v.z ? [true, v] : [false, "XYZ values arent given"]),*/
	trans: () => [true, "rights"], // valid no matter what :3
	stringarray: (v) => Array.isArray(v) ? [true, v] : ConfigHelper.types.string(v)[0] ? [true, v.split(",")] : [false, "failed to parse"],
	bool: (v) => {
		if(typeof v == "object") return [false, "object not a boolean"];
		if(typeof v == "boolean") return [true, v];
		if(!isNaN(v)) {
			if(v > 1 || 0 > v) return [false, "if a number must be 0 or 1"];
			return [true, Boolean(v)];
		};
		let tmp = { t: true, f: false };
		return (tmp[v[0]] ? [true, tmp[v[0]]] : [false, "not a boolean"])
	},
};

module.exports = ConfigHelper;