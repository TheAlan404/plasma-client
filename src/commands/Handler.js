/* Plasma Client | Command Handler */
const { ProxyFilter } = require("../proxy.js");

class CommandHandler {
	constructor(plasma){
		this.plasma = plasma;
		this.commands = new Map();
		this.categories = new Map();
		
		this.plasma.proxy.addFilter("send", "chat", new ProxyFilter({
			type: "DENY",
			filter: this._filter.bind(this),
		}));
	};
	_filter(data){
		if(this.isPrefixed(data.message)) {
			this.handle(data.message);
			return true;
		} else {
			return false;
		};
	};
	get prefix(){
		return this.plasma.config.get("prefix") || ".";
	};
	addCommand(){
		
	};
	handle(str){
		
	};
	isPrefixed(str){
		let { prefix } = this;
		if(prefix === ".") {
			return str.startsWith(prefix) && str[1] != "/" && !str.startsWith("._.");
		} else {
			return str.startsWith(prefix);
		};
	};
	parse(str){
		let { prefix } = this;
		if(!str.startsWith(prefix)) throw new Error("[CommandHandler:parse] Command message doesnt start with the prefix!");
		let args = str.split(" ");
		let cmd = args[0].replace(prefix, "").toLowerCase();
		args[0] = "";
		
	};
	run(){
		
	};
};

class Command {
	constructor(name, desc, args, category, run){
		if(typeof name === "object") return Command.from(name);
		let { name, aliases } = Command.parseName(name);
		this.name = name;
		this.aliases = Array.isArray(aliases) ? aliases : [];
		this.desc = desc;
		this.args = Array.isArray(args) ? args : [];
		this.category = category || "Other";
		this.run = run;
	};
	static from(data){
		return new Command(data.name, data.desc, data.args, data.category, data.run);
	};
	static parseName(str){
		return {
			name: str.split(" ")[0],
			aliases: str.split(" ").slice(1),
		};
	};
	
	// Shorthand Helpers
	addAliases(...aliases){
		aliases.forEach(a => this.aliases.push(a));
	};
	setDesc(desc){
		this.desc = desc;
	};
	setCategory(str){
		this.category = str;
	};
	setRun(fn){
		this.run = fn;
	};
};

class SubcommandGroup {
	constructor(subcommands, none){
		this.list = subcommands;
		this.none = none;
	};
	add(option, fn){
		this.list[option] = fn;
	};
	setNone(fn){
		this.none = fn;
	};
	run(args, ...fnArgs){
		
	};
};









module.exports = {
	Command,
	CommandHandler,
	SubcommandGroup,
};












//