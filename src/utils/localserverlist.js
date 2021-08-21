/* Plasma Client | Local Server List */
const fs = require("fs");
const nbt = require('prismarine-nbt');
const folderPath = require("minecraft-folder-path");

module.exports = () => {
	let direct_connect = "";
	let server_list = "";
	if(fs.existsSync(folderPath + "/options.txt")) {
		let opts = fs.readFileSync(folderPath + "/options.txt").toString();
		opts.replace(/\r/g, "").split("\n").forEach(function(line){
			let arr = line.split(":");
			if(arr[0] == "lastServer") direct_connect = arr.slice(1).join(":");
		});
	};
	
	if(fs.existsSync(folderPath + "/servers.dat")) {
		let servers = nbt.simplify(nbt.parseUncompressed(fs.readFileSync(folderPath + "/servers.dat"))).servers;
		server_list = servers;
	};
	return { server_list, direct_connect };
};