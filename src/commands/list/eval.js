const { Command, SubcommandGroup } = require("@Commands");
const { ProxyFilter } = require("@Proxy");
const Msg = require("@Msg");

const P = new Msg("[P] ", "dark_aqua");

module.exports = (handler) => {
	handler.addCommand(new Command({
		name: "eval",
		desc: "Evaluate JS",
		run: (args, plasma, self) => {
			
			let client = plasma.client;
			let targetClient = plasma.proxy.targetClient;
			let _client = targetClient;
			let Proxy = plasma.proxy;
			
			let o;
			try {
				o = eval(args.join(" "));
			} catch(e) {
				o = e;
			};
			console.log("Eval Command", o);
		},
	}));
};

// .eval client.write("entity_metadata", { entityId: 0, metadata: [{ key: 0x00, type: 0, value: 0x80 }] })