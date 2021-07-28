/* Plasma Client | ChatListener */
const { on } = require("events");

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
		throw new Error("ChatListener broke, use `static prompt()` instead");
		/*const { command, commands = {}, commandArgs = [], cb = () => null, endfilter = () => false, } = opts;
		this.command = command;
		this.commands = commands;
		this.commandArgs = commandArgs;
		this.cb = cb;
		this.endfilter = endfilter;
		
		this.client = client;
		this._start();*/
	};
	/*
	end(){
		this._end();
	};
	
	_start(){
		this.client.on("chat", this._callback.bind(this));
	};
	_callback({ message }){
		// For some reason it breaks so im using this instead of `this._end()`
		let end = () => this.client.removeListener(this._callback);
		
		if(this.command && this.command.length && message.startsWith(this.command)) {
			let cmd = message.replace(this.command, "");
			if(!this.commands[cmd]) return;
			this.commands[cmd](...this.commandArgs);
		} else {
			if(this.cb(message, ...this.commandArgs)) {
				//console.log(this);
				end(); // Fucking hell doesnt want to work ;w;
				return;
			};
		};
		if(this.endfilter(message)) end();
	};
	_end(){
		this.client.removeListener(this._callback);
	};*/
	
	
	static prompt(client, filter = () => true){
		return new Promise((res, rej) => {
		    let listener = ({ message }) => {
		        if(!filter(message)) return;
		        client.off("chat", listener);
		        res(message);
		    };
		    client.on("chat", listener);
		});
	};
};






module.exports = ChatListener;


//
