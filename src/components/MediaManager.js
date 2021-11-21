const VideoPlayer = require("./video/VideoPlayer.js");

class MediaManager {
	constructor(plasma){
		this.plasma = plasma;
		
		this.players = new Map();
	};
	addPlayer(player){
		let i = player.id ?? 0;
		while(this.players.has(i)) i++;
		this.players.set(i, player);
		return this;
	};
	createPlayer(opts){
		let player = new VideoPlayer(this.plasma, opts);
		this.addPlayer(player);
		return player;
	};
};

module.exports = { MediaManager };