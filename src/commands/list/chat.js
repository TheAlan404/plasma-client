const owoify = require("owoify-js");
const { Command, SubcommandGroup } = require("../Handler");
const Msg = require("../../classes/Msg.js");

const P = new Msg("[P] ", "dark_aqua");

const Tones = {
	// tExT
	s: (s) => s..split(" ").map(
		(word) => word.split("").map(
			(char, i) => char[i % 2 === 1 ? "toUpperCase" : "toLowerCase"]()
		).join("")
	).join(" "),
	
	// *text*
	me: (s) => "*" + s + "*",
	
	owo: (s) => owoify(s),
	uwu: (s) => owoify(s, "uwu"),
	uvu: (s) => owoify(s, "uvu"),
};

module.exports = function(handler){
	handler.addCommand(new Command({
		name: "ping",
		desc: "Example Command",
		category: "chat",
		run: (plasma, args) => {
			plasma.chat(new Msg("> Pong!", "gray"));
		},
	});
	
	handler.addCommand({
		name: "tone",
		desc: "Use a message modifier",
		aliases: ["t"],
		examples: [".tone owo hello everybody!"],
		category: "chat",
		run: (args, plasma) => {
			if(!args[1]) return plasma.chat([P, new Msg("Usage: .tone <tone> <message...>")]);
			let fn = Tones[args[1]];
			if(!fn) return plasma.chat([P, new Msg(`No message modifier named '${args[1]}', available modifiers: ${Object.keys(Tones).join(", ")}`, "gray")]);
			plasma.proxy.targetClient.write("chat", { message: fn(args.slice(2).join(" ")) });
		},
	});
	
	handler.addCommand({
		name: "me",
		desc: "Makes your message have *emphasis*",
		category: "chat",
		examples: [".me becomes a pickle"],
		run: (args, plasma) => {
			if(!args[1]) return plasma.chat([P, new Msg("Usage: .me <message...>")]);
			plasma.proxy.targetClient.write("chat", { message: Tones.me(args.slice(1).join(" ")) });
		},
	});
};

module.exports.Tones = Tones;