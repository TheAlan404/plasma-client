/* Plasma Client | Command Handler */
const fs = require("fs");
const { ProxyFilter } = require("@Proxy");
const getStackTrace = require("../utils/stackTrace.js");
const Msg = require("@Msg");

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
			label: "plasma commandhandler",
		}));
		
		this.loadCommands();
		plasma.Command = Command;
		plasma.SubcommandGroup = SubcommandGroup;
	};
	loadCommands(){
		let isInsideSrc = !fs.existsSync("./src");
		let listPath = `./${isInsideSrc ? "" : "src/"}commands/list`;
		let files = fs.readdirSync(listPath).filter(fn => fn.endsWith(".js"));
		for(let fn of files){
			try {
				let m = require(`./list/${fn}`);
				if(!m) throw new Error("Command file doesnt export anything!");
				if(typeof m === "function") {
					m(this);
				};
			} catch(e) {
				this.plasma.handleError(e);
			};
		};
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
		if(!(cmd instanceof Command)) cmd = new Command(cmd);
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
		console.log(`[Commands] Registered '${cmd.name}'`);
	};
	async handle(str){
		let [cmdName, cmdArgs] = this.parse(str);
		if(!cmdName) return this.unknownCommand();
		let cmd = this.commands.get(cmdName);
		if(Array.isArray(cmd.middleware)) {
			// TODO: finish middleware handling
		};
		if (cmd.args && cmd.args.length) {
			const req = cmd.args.filter(a => a.startsWith(':')).length;
			if (req > 0 && !cmdArgs[req]) return this.plasma.chat([new Msg("[P] ", "dark_aqua"), new Msg(cmd.usage, "gray")]);
		}
		if(!cmd.hideInput) this.plasma.chat(new Msg(`> ${str.replace(this.prefix, "")}`, "white"));
		
		if(cmd.run instanceof SubcommandGroup) {
			return cmd.run.run(cmdArgs, this.plasma, cmd);
		};
		if(!cmd.run) throw new Error(`[CommandHandler:run] Command ${cmdName} does not have a run() function!`);
		cmd.run(cmdArgs, this.plasma, cmd);
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
	constructor(data){
		this.name = data.name;
		this.aliases = Array.isArray(data.aliases) ? data.aliases : [];
		this.desc = data.desc;
		this.args = Array.isArray(data.args) ? data.args : [];
		this.category = data.category || "Other";
		this.run = data.run;
		this.middleware = Array.isArray(data.middleware) ? data.middleware : [];
		this.examples = Array.isArray(data.examples) ? data.examples : [];
		this.hideInput = data.hideInput ?? false;
		
		for(let prop in data) {
			if(this[prop] === undefined) this[prop] = data[prop];
		};
	};
	static argToString(arg){
		return `${arg.startsWith(':') ? '<' : '['}${arg.slice(1)}${arg.startsWith(':') ? '>' : ']'}`;
	};
	
	/**
	* Returns the usage string
	*/
	usage(...subcmdPath){
		subcmdPath = subcmdPath.flat(Infinity);
		if(this.run instanceof SubcommandGroup) {
			return `${this.name} ${this.run.choices} [...]`;
		};
		return `${this.name}${this.args.length ? ' ' : ''}${this.args.map(Command.argToString).join(' ')}`;
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
	* new Command({
	*	name: "note",
	*	desc: "Manages your notes",
	*	category: "personal",
	*	run: new SubcommandGroup({
	*	 	list: () => {},
	*		edit: () => {},
	*		delete: () => {},
	*	}, (arg) => {
	*	 	// arg is a string
	*	 	if(arg) reply(`${arg} is not a subcommand`)
	*	 	else reply("Usage: note <list|edit|delete>");
	*	}),
	* });
	*/
	constructor(subcommands, none, depth = 1){
		this.list = {};
		this._depth = depth;
		for(let sArg in subcommands){
			this.add(sArg, subcommands[sArg]);
		};
		this.setNone(none);
	};
	get choices(){
		return `<${Object.keys(this.list).join("|")}>`;
	};
	add(option, fn){
		if(fn instanceof SubcommandGroup) fn._depth = (this._depth + 1);
		this.list[option] = fn;
	};
	setNone(fn){
		this.none = fn ?? ((arg, plasma, cmd) => {
			if(arg) {
				plasma.chat([new Msg("[P] ", "dark_aqua"), new Msg(`Error: ${arg} is not a valid subcommand! Subcommands: ${this.choices}`, "gray")]);
			} else {
				plasma.chat([new Msg("[P] ", "dark_aqua"), new Msg(cmd.usage, "gray")]);
			};
		});
	};
	run(args, plasma, cmdObj){
		let arg = args[this._depth];
		if(this.list[arg]) {
			let _run = this.list[arg];
			if(_run instanceof SubcommandGroup) {
				return _run.run(args, plasma, cmdObj);
			};
			_run(args, plasma, cmdObj);
		} else {
			let _run = typeof this.none === "string" ? (typeof this.list[this.none] === "function" ? this.list[this.none] : this.list[this.none].run) : this.none;
			_run(arg, plasma, cmdObj);
		};
	};
};









module.exports = {
	Command,
	CommandHandler,
	SubcommandGroup,
};












//