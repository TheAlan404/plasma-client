// video_worker.js
/*
* This file takes in a Resource (youtube videos/mp4 files/streams etc) and uses FFMPEG to decode the video (if any) into PNG frames.
*/

const { parentPort, isMainThread } = require("worker_threads");
const fs = require("fs");
const FFMPEG_PATH = require("ffmpeg-static");
const ytdl = require("ytdl-core");
const fetch = require("node-fetch");
const StreamSplitter = require("stream-split");

const PNGHEADER = Buffer.from("89504E470D0A1A0A", "hex");
let state = "waiting";
let _ffmpegProcess = null;

if(isMainThread) throw new Error("Cannot execute a worker thread as main");

parentPort.on("message", async (data) => {
	switch(data.type) {
		case "start":
			Run(data.source, data.fps);
			break;
		case "pause":
			break;
		case "unpause":
			break;
		case "stop":
			
			break;
		case "destroy":
			break;
	};
});

const isYoutubeSource = (src) => {
	try {
		ytdl.getVideoID(src);
		return true;
	} catch(e) {
		return false;
	};
};

/**
* Parse the given source and return a (readable) stream
* @param {string} source
* @return {ReadableStream}
*/
async function resolveSource(src){
	if(typeof src === "string") {
		if(isYoutubeSource(src)) return ytdl(src);
		if(fs.existsSync(src)) return fs.createReadStream(src);
		if(src.startsWith("http")) {
			let res = await fetch(src);
			return res.body;
		};
		return null;
	} else {
		return src; // no idea
	}
};

function startFFMPEG(fps){
	let proc = spawn(FFMPEG_PATH, [
		"-i", "-",
		"-c:v", "png",
		"-r", fps ?? 1,
		"-preset", "ultrafast", // does this even help
		"-hide_banner",
		"-f", "image2pipe",
		"-",
	]);
	_ffmpegProcess = proc;
	proc.on("close", () => _ffmpegProcess = null);
	return proc;
};

async function Run(src, fps){
	let stream = await resolveSource(src);
	let ffmpeg = startFFMPEG(fps);
	let splitter = new StreamSplitter(PNGHEADER);
	stream.pipe(ffmpeg.stdin);
	ffmpeg.stdout.pipe(splitter);
	splitter.on("data", (data) => {
		parentPort.postMessage({
			type: "frame",
			data,
		});
	});
};



































//