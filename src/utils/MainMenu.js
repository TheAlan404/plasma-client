/* Plasma Client | (UI) MainMenu */
const { TextMenu, ButtonRow, ButtonList } = require("../classes/TextMenu.js");
const Msg = require("../classes/Msg.js");
const { server_list, direct_connect } = require("./localserverlist.js")();

const menus = {
	main: (plasma, client, ctx) => {
		
	},
};

function init(plasma, client){
	let main = new TextMenu({
		header: "",
		footer: "",
		contents: [
			new ButtonList([...removeCurrent(plasma, server_list).map(({ name, ip }) => 
				new Msg(ip, "aqua", [
					new Msg("Connect to ", "white"),
					new Msg('"'+name+'"', "aqua"),
					new Msg("\nIP: ", "gold"), new Msg(ip, "white")
				], ip)
			)]),
			...((direct_connect.length && direct_connect != plasma.localIP) ? [
				new Msg("- [direct connect]\n", "green", [
					new Msg("Connect to the last direct connect IP:", "white"),
					new Msg("\n"),
					new Msg(direct_connect, "gold")
				], direct_connect)
			] : []),
			// TODO: Make this customizeable etc
			new ButtonRow([
				new Msg("Refresh", "gold", 
					new Msg("Refreshes the server list\nIf no server is listed click this button.", "gray"),
				"_REFRESH"),
				new Msg("Update", "dark_purple",
					new Msg("Check for updates.", "gray"),
				"_UPDATES"),
				new Msg("Change Nick", "blue",
					new Msg("Changes nick", "gray"),
				"_NICK"),
				new Msg("Change Prefix", "purple",
					new Msg("Changes the command prefix.\Will be changed via a config command in the future.", "gray"),
				"_PREFIX"),
				new Msg("Settings", "gray",
					new Msg("Configure general settings for Plasma", "gray"),
				"_CONFIG"),
			]),
		],
	});
	main.send(client);
	// TODO: Attach chat message listener
	// TODO: Api for chat menus
	// TODO: init proxy
	// TODO: config menu
};

function removeCurrent(plasma, server_list){
	let tmp = [];
	for(let indx in server_list){
		let { ip } = server_list[indx];
		if(ip == plasma.localIP) continue;
		tmp.push(server_list[indx]);
	};
	return tmp;
};

module.exports = {
	init,
};