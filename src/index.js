/* Plasma Client | Main File */

const temp_meta = {
	startTime: Date.now(),
};
require("./installer.js")(temp_meta);
const PlasmaClient = require("./plasmaclient.js");
plasma.proxy = new PlasmaClient(process.env.PLASMA_PORT);