const { Command, SubcommandGroup } = require("@Commands");
const { ProxyFilter } = require("@Proxy");
const Msg = require("@Msg");

const P = new Msg("[P] ", "dark_aqua");

module.exports = (handler) => {
	handler.addCommand(new Command({
		name: "forcegm",
		category: "util",
		desc: "Changes your gamemode clientside",
		usage: [":<0|1|2|3>"],
		run: (args, plasma, self) => {
			let gm = Number(args[1]);
			if(isNaN(gm)) return plasma.chat([P, new Msg(self.usage(), "gray")]);
			client.write("game_state_change", { reason: 3, gameMode: gm });
		},
	}));
};

// .eval client.write("entity_metadata", { entityId: 0, metadata: [{ key: 0x00, type: 0, value: 0x80 }] })