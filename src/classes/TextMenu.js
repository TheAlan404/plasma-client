/* Plasma Client | TextMenu */

const Msg = require("./Msg.js");

const ContentRenderers = {
	text: (client, content) => client.chat(content.value),
	string: (client, content) => client.chat(content.value),
	buttonrow: (client, content) => {
		client.chat(new ButtonRow(content.list, { border: content.border }).toText());
	},
	buttonlist: (client, content) => {
		let components = new ButtonList(content.list, { border: content.border }).toText();
		components.forEach((comp) => client.chat(comp));
	},
};

class TextMenu {
	constructor(opts = {}){
		const { header = "", footer = "", contents = [] } = opts;
		this.header = header;
		this.footer = footer;
		this.contents = contents;
	};
	send(client){
		if(this.header && this.header.length) client.chat(this.header);
		for(let content of this.contents){
			if(!content) continue;
			if(content instanceof Msg || typeof content == "string" || Array.isArray(content)) {
				client.chat(content);
				continue;
			};
			if(ContentRenderers[content.type]) {
				ContentRenderers[content.type](client, content);
			} else {
				throw new Error("ContentRenderer does not have type "+content.type);
			};
		};
		if(this.footer && this.footer.length) client.chat(this.footer);
	};
};

class ButtonRow {
	/**
	* A ButtonRow for TextMenu
	* @constructor
	* @param {Msg[]} list - list of the buttons
	* @param {object} [opts] - other options
	* @param {string[]} [opts.border] - border for the buttons
	*/
	constructor(list, opts = {}){
		const { border = [" [✧", "] "] } = opts;
		this.list = Array.isArray(list) ? list : ButtonRow.parseString(list);
		this.border = border;
		this.type = "buttonrow";
	};
	toText(){
		let text = [];
		for(let msg of this.list){
			text.push(new Msg(this.border[0], msg._color, msg._hover, msg._click));
			text.push(msg);
			text.push(new Msg(this.border[1], msg._color, msg._hover, msg._click));
		};
		return text;
	};
	static parseString(str){
		return str.split(";").map(b => new Msg(...b.split(":")));
	};
};

class ButtonList {
	/**
	* A ButtonList of texts
	* @constructor
	* @param {Msg[]} list - list of the texts
	* @param {object} [opts] - other options
	* @param {string[]} [opts.border] - border for the buttons
	*/
	constructor(list, opts = {}){
		const { border = ["> [", "]"] } = opts;
		this.list = Array.isArray(list) ? list : ButtonRow.parseString(list);
		this.border = border;
		this.type = "buttonlist";
	};
	toText(){
		let text = [];
		for(let msg of this.list){
			text.push([this.border[0], msg, this.border[1]]);
		};
		return text;
	};
};






module.exports = {
	TextMenu,
	ButtonRow,
	ButtonList,
	ContentRenderers,
};


//