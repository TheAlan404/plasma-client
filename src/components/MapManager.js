class MapManager {
	constructor(plasma){
		this.plasma = plasma;
		
		this.ignoreOverrides = new Set();
		this.heldMapID = null;
		this.cursor = [0, 0];
	};
	send(mapID, buf){
		if(this.ignoreOverrides.has(mapID)) return;
		this.plasma.write("map", {
			itemDamage: mapID,
			scale: 0,
			trackingPosition: true,
			icons: (this.heldMapID === mapId ? [
				{
					directionAndType: 0x02,
					x: this.cursor[0],
					z: this.cursor[1],
				},
			] : []),
			columns: -128,
			rows: -128,
			x: 0,
			y: 0,
			data: (data),
		});
	};
	setCursor(x, y){
		let mapID = this.heldMapID;
		if(!mapID) return;
		this.plasma.write("map", {
			itemDamage: mapID,
			scale: 0,
			trackingPosition: true,
			icons: [
				{
					directionAndType: 0x02,
					x: x,
					z: y,
				},
			],
			columns: 0,
		});
		this.cursor = [x, y];
	};
};

module.exports = { MapManager };