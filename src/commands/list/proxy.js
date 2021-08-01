const { ProxyFiler } ??
const { Command, SubcommandGroup } = require("../Handler");
const Msg = require("../../classes/Msg.js");

const P = new Msg("[P] ", "dark_aqua");
const MEDAL_ALERT = [new Msg("(", "dark_red"), new Msg("!", "red"), new Msg(") ", "dark_red")];

module.exports = function(handler){
	handler.addCommand(new Command({
		name: "ping",
		desc: "Example Command",
		category: "proxy",
		run: new SubcommandGroup({
			filter: new SubcommandGroup({
				list: (args, plasma) => {
					let components = [];
					let SEP = new Msg(":");
					
					components.push([P, new Msg("--- Send Filters ---", "gray")]);
					if(!plasma.filter.sendAll) components.push([P, ...MEDAL_ALERT, new Msg("SendAll is OFF")]);
					if(plasma.filter.send.size) {
						plasma.filter.send.forEach((list = [], name = "") => {
							list.forEach(filter => {
								let comp = [P, new Msg(name, "gray"), SEP, filter.type];
								if(filter.label) comp.push(new Msg(";'" + filter.label + "'"));
								components.push(comp);
							});
						});
					} else {
						components.push([P, new Msg("There isnt any 'send' filters.", "gray")]);
					};
					
					components.push([P, new Msg("--- Recieve Filters ---", "gray")]);
					if(!plasma.filter.recieveAll) components.push([P, ...MEDAL_ALERT, new Msg("RecieveAll is OFF")]);
					if(plasma.filter.recieve.size) {
						plasma.filter.recieve.forEach((list = [], name = "") => {
							list.forEach(filter => {
								let comp = [P, new Msg(name, "gray"), SEP, filter.type];
								if(filter.label) comp.push(new Msg(";'" + filter.label + "'"));
								components.push(comp);
							});
						});
					} else {
						components.push([P, new Msg("There isnt any 'recieve' filters.", "gray")]);
					};
					
					components.forEach(comp => plasma.chat(comp));
				},
				create: (args, plasma) => {
					if(!args[3] || !args[4]) return plasma.chat([P, new Msg("Usage: .proxy filter create <route.name> <(read|modify|deny)> [fn]", "gray")]);
					let route = args[3][0] == "s" ? "send" : (args[3][0] == "r" ? "recieve" : "ERROR");
					if(route == "ERROR") return plasma.chat([P, new Msg("Route must be present! Example: 'send.position'", "gray")]);
					switch(args[4][0].toLowerCase()) {
						"r":
							try {
								plasma.proxy.addFilter(args[3], ProxyFiler.read());
							} catch(e) {
								plasma.chat([P, MEDAL_ALERT, new Msg("Error: " + e.toString(), "dark_gray")]);
							};
							plasma.chat([P, new Msg("Read filter added.", "gray")]);
							break;
						"m":
							if(!args[5]) return plasma.chat([P, MEDAL_ALERT, new Msg("A JS function must be present for the modify filter type!", "gray")]);
							let fn;
							try {
								fn = eval(args.slice(5).join(" "));
							} catch(e) {
								return plasma.chat([P, MEDAL_ALERT, new Msg("An error occurred in your function: " + e.toString(), "gray")]);
							};
							if(typeof fn !== "function") return plasma.chat([P, MEDAL_ALERT, new Msg("Error: Input is not a function", "gray")]);
							try {
								plasma.proxy.addFilter(args[3], ProxyFiler.modify(fn));
							} catch(e) {
								plasma.chat([P, MEDAL_ALERT, new Msg("Error: " + e.toString(), "dark_gray")]);
							};
							plasma.chat([P, new Msg("Modify filter added.", "gray")]);
							break;
						"d":
							try {
								plasma.proxy.addFilter(args[3], ProxyFiler.deny());
							} catch(e) {
								return plasma.chat([P, MEDAL_ALERT, new Msg("Error: " + e.toString(), "dark_gray")]);
							};
							plasma.chat([P, new Msg("Deny filter added.", "gray")]);
							break;
						default:
							plasma.chat([P, new Msg(`${args[4]} is not a proxy filter type. Available types: 'read', 'modify' and 'deny'`, "gray")]);
					};
				},
			}, "list"),
		}, (arg, plasma) => {
			if(arg) {
				plasma.chat(P, new Msg(`Error: ${arg} is not a valid subcommand!`, "gray"));
			} else {
				plasma.chat(P, new Msg("Usage: .proxy <(filter|clients)>", "gray"));
			};
		}),
	});
};