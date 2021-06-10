/* Plasma Client | ChatListener */

class ChatListener {
	/**
	* How to not listen for chat.
	* pls fix my shitty code -dennis (i will immediately accept a PR if you make this any better
	* // TODO: add more docs
	* @constructor
	* @param {mc.Client} client
	* @param {object} opts
	* @param {string} opts.command
	* @param {object} opts.commands
	* @param {*[]} opts.commandArgs
	* @param {function} opts.cb
	* @param {function} opts.endfilter
	*/
	constructor(client, opts = {}){
		const { command, commands = {}, commandArgs = [], cb = () => null, endfilter = () => false, } = opts;
		this.command = command;
		this.commands = commands;
		this.commandArgs = commandArgs;
		this.cb = cb;
		this.endfilter = endfilter;
		
		this.client = client;
		this._start();
	};
	
	end(){
		this._end();
	};
	
	_start(){
		this.client.on("chat", this._callback.bind(this));
	};
	_callback({ message }){
		if(this.command && this.command.length && message.startsWith(this.command)) {
			let cmd = message.replace(this.command);
			if(!this.commands[cmd]) return;
			this.commands[cmd](...this.commandArgs);
		} else {
			if(this.cb(message, ...this.commandArgs)) {
				this._end();
				return;
			};
		};
		if(this.endfilter(message)) this._end();
	};
	_end(){
		this.client.removeListener(this._callback);
	};
};






module.exports = ChatListener;


//