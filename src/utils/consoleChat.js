/* Plasma Client | Console Chat */
const { createClient } = require("minecraft-protocol");
const chalk = require("chalk");

module.exports = (plasma) => {
	plasma.localIP = process.argv[3] // fix later ;3
	plasma.chatclient = createClient({
		username: "console",
		host: plasma.localIP.split(":")[0],
		port: plasma.localIP.split(":")[1] || 25565, 
	});
	plasma.chatclient.on("chat", ({ message }) => {
		console.log(buildString(message));
	});
	plasma.stdin = process.openStdin();
	plasma.stdin.on("data", (d) => {
		let msg = d.toString().trim();
		plasma.chatclient.write("chat", { message: msg });
	});
};

const colorConvert = {
      'black': "black",
      'dark_blue': "blue",
      'dark_green': "green",
      'dark_aqua': "cyan",
      'dark_red': "red",
      'dark_purple': "magenta",
      'gold': "yellow",
      'gray': "gray",
      'dark_gray': "gray",
      'blue': "blueBright",
      'green': "greenBright",
      'aqua': "cyanBright",
      'red': "redBright",
      'light_purple': "magentaBright",
      'yellow': "yellowBright",
      'white': "white",
      'reset': "white",
};

function buildString(jsonstr){
	let comp;
	let current = "";
	try {
		comp = JSON.parse(jsonstr);
	} catch(e) {
		return jsonstr;
	};
	if(typeof comp == "string") return comp;
	if(Array.isArray(comp)) {
		return comp.map(obj => buildString(JSON.stringify(obj))).join("");
	};
	if(comp.text) current = comp.text;
	if(comp.bold) current = chalk.bold(current);
	if(comp.italic) current = chalk.italic(current);
	if(comp.underlined) current = chalk.underline(current);
	if(comp.bold) current = chalk.bold(current);
	if(comp.color && colorConvert[comp.color]) current = chalk[colorConvert[comp.color] || "white"](current);
	return current + (Array.isArray(comp.extra) ? comp.extra.map(obj => buildString(JSON.stringify(obj))).join("") : "");
};
