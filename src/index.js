/* Plasma Client | Main File */

const temp_meta = {
	startTime: Date.now(),
};
require("./installer.js")(temp_meta);
const PlasmaClient = require("./plasmaclient.js");
const Plasma = new PlasmaClient();