/* Plasma Client | Command Handler */
const { ProxyFilter } = require("../proxy.js");
const getStackTrace = require("../utils/stackTrace.js");

class CommandHandler {
	constructor(plasma){
		this.plasma = plasma;
		this.commands = new Map();
		this.aliases = new Map();
		this.categories = new Map();
		this.middlewares = new Map();
		
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
	unknownCommand(){};
	invalidUsage(){};
	errored(){};
	
	get prefix(){
		return this.plasma.config.get("prefix") || ".";
	};
	addCommand(cmd){
		if(!cmd.name) throw new Error("[CommandHandler:addCommand] Nameless command!");
		if(this.commands.has(cmd.name) || this.aliases.has(cmd.name)) {
			let caller = getStackTrace();
			console.warn(`[CommandHandler:addCommand] Command overwritten (${cmd.name}) by ${caller}!`);
		};
		this.commands.set(cmd.name, cmd);
		if(Array.isArray(cmd.aliases)) {
			cmd.aliases.forEach(alias => {
				if(this.commands.has(alias) || this.aliases.has(alias)) {
					let caller = getStackTrace();
					console.warn(`[CommandHandler:addCommand] Command overwritten (${cmd.name} / aliased ${alias}) by ${caller}!`);
				};
				this.aliases.set(alias, cmd.name);
			});
		};
	};
	async handle(str){
		let [cmdName, cmdArgs] = this.parse(str);
		if(!cmdName) return this.unknownCommand();
		let cmd = this.commands.get(cmdName);
		let _run = typeof cmd.run === "function" ? cmd.run : (typeof cmd.run.run === "function" ? cmd.run.run : null);
		if(!_run) throw new Error(`[CommandHandler:run] Command ${cmdName} does not have a run() function!`);
		if(Array.isArray(cmd.middleware)) {
			// TODO: finish middleware handling
		};
		_run(cmdArgs, this.plasma, cmd);
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
		if(!this.commands.has(cmd)) {
			if(!this.aliases.has(cmd)) return [null, []];
			cmd = this.aliases.get(cmd);
		};
		return [cmd, args];
	};
};

class Command {
	constructor(name, desc, args, run, category, middleware){
		if(typeof name === "object") return Command.from(name);
		let { cmdname, aliases } = Command.parseName(name);
		this.name = cmdname;
		this.aliases = Array.isArray(aliases) ? aliases : [];
		this.desc = desc;
		this.args = Array.isArray(args) ? args : [];
		this.category = category || "Other";
		this.run = run;
		this.middleware = Array.isArray(middleware) ? middleware : [];
	};
	static from(data){
		return new Command(data.name, data.desc, data.args, data.run, data.category, data.middleware);
	};
	static parseName(str){
		return {
			name: str.split(" ")[0],
			aliases: str.split(" ").slice(1),
		};
	};
	
	/**
	* Returns the usage string
	*/
	get usage(){
		
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
	addMiddleware(name){
		this.middleware.push(name);
	};
};

class SubcommandGroup {
	/**
	* Represents a subcommand group
	* This class can be nested
	* @param {object} subcommands - key is arg, value is the function or another subcommand group
	* @param {function} none - the function called when the user doesnt type a subcommand
	* check the first argument of this function to determine if the user typed an invalid subcommand
	* 
	* @example ```js
	* new Command("note", "Manages your notes", [], new SubcommandGroup({
	* 	list: () => {},
	*	edit: () => {},
	*	delete: () => {},
	* }, (arg) => {
	* 	// arg is a string
	* 	if(arg) reply(`${arg} is not a subcommand`)
	* 	else reply("Usage: note <list|edit|delete>");
	* }), "personal");
	*/
	constructor(subcommands, none, depth = 1){
		this.list = {};
		for(let subcommandArg in subcommands){
			this.add(subcommandArg, subcommands[subcommandArg]);
		};
		this.setNone(none);
		this._depth = depth;
	};
	add(option, fn){
		if(fn instanceof SubcommandGroup) fn._depth = this._depth + 1;
		this.list[option] = fn;
	};
	setNone(fn){
		this.none = fn ?? ((arg, plasma, cmd) => {
			// todo..?
		});
	};
	run(args, plasma, cmdObj){
		let arg = args[this._depth];
		if(this.list[arg]) {
			let _run = typeof this.list[arg] === "function" ? this.list[arg] : this.list[arg].run;
			_run(args, plasma, cmdObj);
		} else {
			this.none(arg, plasma, cmdObj);
		};
	};
};









module.exports = {
	Command,
	CommandHandler,
	SubcommandGroup,
};












//