// worker.js
/*
* This file converts a PNG into the minecraft map data format.
*/

const { parentPort, isMainThread, workerData: displays } = require("worker_threads");
const sharp = require("sharp");
const Colors = require("./Colors.json");

if(isMainThread) throw new Error("Cannot execute a worker thread as main");

parentPort.on("message", async ({ type, data }) => {
	switch(type) {
		case "frame":
			Convert(data);
			break;
	};
});





async function Convert(pngData){
	const { data: resizedPNG } = await sharp(pngData)
			.resize({
				width: displays.pixelWidth,
				height: displays.pixelHeight,
				fit: 'contain'
			})
			.removeAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });
	let canvas = createCanvas(displays.pixelWidth, displays.pixelHeight);
	let ctx = canvas.getContext("2d");
	let img = await loadImage(resizedPNG);
	ctx.drawImage(img, 0, 0);
	
	let output = {};
	
	let i = 0;
	for (let y = 0; y < displays.height; y++) {
		for (let x = 0; x < displays.width; x++) {
			let dataRGB = ctx.getImageData(x * 128, y * 128, 128, 128).data;
			let chunk = [];
			let j = 0;
			for (let k = 0; k < dataRGBA.length; k += 3) {
				chunk.push(convertColor(dataRGB[k], dataRGB[k + 1], dataRGB[k + 2]));
			};
			output[displays.ids[i]] = Buffer.from(chunk);
			i++;
			chunk = null;
		};
	};
	
	parentPort.postMessage({
		type: "frame",
		data: output,
	});
};



const toHex = (r, g, b) => ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);

const cache = {};
function convertColor(r, g, b){
	let k = toHex(r, g, b);
	if(cache[k]) return cache[k];
	let c = nearest(r, g, b);
	cache[k] = c;
	return c;
};

const nearest = (r1, g1, b1) => {
	let i = 0xffffffff
	let result = 0
	// fastest iteration afaik
	for (let reverse = Colors.length - 1; reverse >= 0; reverse--) {
		const { r: r2, g: g2, b: b2 } = Colors[reverse];
		const deviation = ((r2 - r1) * 0.3) ** 2 + ((g2 - g1) * 0.59) ** 2 + ((b2 - b1) * 0.11) ** 2;
		if (deviation < i) {
			i = deviation;
			result = reverse + 4;
		}
	}
	return result;
}





















//