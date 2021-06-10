/* Plasma Client | Main File */

async function main() {
	const temp_meta = {
		startTime: Date.now(),
	};
	require("./installer.js")(temp_meta);
	const { checkUpdate } = require("./updater.js");
	await checkUpdate();
	const PlasmaClient = require("./plasmaclient.js");
	const Plasma = new PlasmaClient();
};

main();