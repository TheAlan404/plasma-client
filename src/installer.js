/*
# Plasma Client | Installer
Checks for imcompatability and installs or updates the dependencies.
*/
const fs = require("fs");
const util = require("util");
const { execSync } = require("child_process")
const { dependencies } = require("../package.json");

module.exports = (meta) => {
	checkNodeVersion();

	try {
		checkDepencencies();
	} catch(e){
		console.log("--- Plasma Client Install ---");
		console.log("> Installing... (or updating)");
		let txt = execSync("npm install");
		console.log(txt.toString());
		console.log("> Install complete! Starting...");
		meta.depInstall = true;
	};
};

function checkNodeVersion(){
	if(parseInt(process.versions.node.split('.')[0]) < 14){
		console.log("ERROR! Your NodeJS version is old!");
		console.log("For Plasma to be able to run you must upgrade it.");
		console.log("Required version: At least 14");
		console.log("> https://nodejs.org/");
		process.exit();
	}
};

function checkDepencencies(){
	for(let dep in dependencies) {
		require.resolve(dep);
	};
};








//