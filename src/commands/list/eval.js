const { Command, SubcommandGroup } = require("../Handler");
const Msg = require("../../classes/Msg.js");

const P = new Msg("[P] ", "dark_aqua");

module.exports = (handler) => {
	handler.addCommand(new Command({
		name: "eval",
		desc: "Evaluate JS",
		run: (args) => {
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