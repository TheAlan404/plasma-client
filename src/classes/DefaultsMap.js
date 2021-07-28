class DefaultsMap extends Map {
	/**
	* A Map object with default values.
	* @param {*} gen
	* if gen is a function, its called with the key argument and the return value is set
	* if it isnt, it does the same thing without calling a function
	*/
	constructor(gen, ...args){
		super(...args);
		this._gen = gen;
	};
	get(key){
		if(!this.has(key)) this.set(key, (typeof this._gen === "function" ? this._gen(key) : this._gen));
		return super.get(key);
	};
};

module.exports = DefaultsMap;