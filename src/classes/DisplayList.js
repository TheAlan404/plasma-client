class DisplayList {
	/**
	* A minecraft map display
	* @param {number} width
	* @param {number} height
	* @param {number[]} map ID's - item data / itemDamage
	*/
	constructor(width, height, ids) {
		this.width = width ?? 1;
		this.height = height ?? 1;
		this.pixelWidth = this.width * 128;
		this.pixelHeight = this.height * 128;
		this.ids = Array.isArray(ids) ? ids : new Array(this.width * this.height).fill(0);
		this.pixelCount = (this.width * 128) * (this.height * 128);
	};
};

module.exports = DisplayList;