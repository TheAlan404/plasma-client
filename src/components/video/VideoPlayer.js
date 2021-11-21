const { Worker } = require("worker_threads");
const DisplayList = require("@Classes/DisplayList");

require('sharp'); // Required

class VideoPlayer {
	constructor(plasma, options = {}){
		this.plasma = plasma;
		
		const { displays = new DisplayList() } = options;
		this.displays = displays;
		
		this.videoDecoder = new Worker(__dirname + "/video_worker.js");
		this.frameEncoder = null;
		
		this.videoDecoder.on("message", ({ type, data }) => {
			switch(type){
				case "frame":
					this.frameEncoder.postMessage({
						type: "frame",
						data,
					});
					break;
			};
		});
		
		this._initFrameEncoder();
	};
	
	async setDisplays(displays){
		this.displays = displays;
		this._initFrameEncoder();
	};
	
	async _initFrameEncoder(){
		try {
			if(this.frameEncoder) await this.frameEncoder.terminate();
		} catch(e){};
		this.frameEncoder = new Worker(__dirname + "/worker.js", {
			workerData: this.displays,
		});
		this.frameEncoder.on("message", ({ type, data }) => {
			switch(type){
				case "frame":
					this.plasma.maps.sendBulk(data);
					break;
			};
		});
	};
	
	async play(src){
		
	};
};

module.exports = VideoPlayer;