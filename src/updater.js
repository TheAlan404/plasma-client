/* Plasma Client | updater */
const fs = require("fs");
const fetch = require("node-fetch");
const asar = require("asar");
const { on } = require("events");

let { updateURL = "https://raw.githubusercontent.com/TheAlan404/plasma-static/main/version.json", version } = require("./build.json");
let pendingUpdate = false;
let newVersion = version;
let installURL = null;

async function checkUpdate(){
	try {
		let res = await fetch(updateURL);
		let json = await res.json();
		
		if(json.version != version) {
			pendingUpdate = true;
			newVersion = json.version;
		};
		return { pendingUpdate, newVersion };
	} catch(err){
		return { error: err };
	};
};

async function installUpdate(cb = () => null){
	await downloadUpdate();
	unpackUpdate();
	fs.unlinkSync("./UpdateFile.asar");
	cb();
};

async function downloadUpdate(url = installURL, progressCB = (n) => console.log("Update Progress "+n+"%")){
	if(!url) return console.log("Install URL not found");
	let res = await fetch(url);
	let file = fs.createWriteStream("./UpdateFile.asar");
	res.body.pipe(file);
	await on(file, "finish");
	return "./UpdateFile.asar";
};

function unpackUpdate(file = "./UpdateFile.asar"){
	asar.extractAll(file, "./"); // Overwrite itself because yes
	asar.uncacheAll();
};

module.exports = {
	downloadUpdate,
	checkUpdate,
	pendingUpdate,
	newVersion,
	installUpdate,
	unpackUpdate,
};