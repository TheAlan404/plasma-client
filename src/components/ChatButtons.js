const { ProxyFilter } = require("@Proxy");
const Msg = require("@Msg");

const P = new Msg("[P] ", "dark_aqua");

class ChatButtonHandler {
	constructor(plasma){
		this.plasma = plasma;
		this.buttons = [];
		BuiltIns.forEach(btn => this.addButton(btn));
		
		this.plasma.proxy.addFilter("recieve", "chat", new ProxyFilter({
			type: "MODIFY",
			filter: this._filter.bind(this),
			label: "plasma buttons api",
		}));
	};
	_filter(data){
		try {
			let comp = JSON.parse(data.message);
			if(Array.isArray(comp)) {
				comp.forEach(this._modify.bind(this));
			} else if(typeof comp === "object") {
				if(comp.extra) {
					comp.extra.forEach(this._modify.bind(this));
				};
			};
			return { message: JSON.stringify(comp) };
		} catch (e) {
			this.plasma.handleError(e);
			return data;
		};
	};
	_modify(comp, i, all){ // TODO: fix very bad var names
		if(typeof comp === "string") return comp;
		if(!comp.text) return comp;
		this.buttons.forEach(btn => {
			if(!btn.test(comp.text)) return;
			let msgs = btn.run(comp.text.trim().replace(btn.name + ":", "").trim(), comp.color, comp);
			if(!msgs) return;
			if(!Array.isArray(msgs)) msgs = [msgs];
			let ii = msgs.length;
			msgs.forEach(msg => {
				all.splice(i+ii, 0, msg);
				ii--;
			});
		});
	};
	
	addButton(btn){
		if(!this.buttons.includes(btn)) this.buttons.push(btn);
		console.log(`[ChatButtons] Registered '${btn.name || btn.regex}'`);
	};
};

class ChatButton {
	constructor(data, fn){
		if(typeof data === "string") data = {
			name: data,
			run: fn,
		};
		
		this.name = data.name;
		this.regex = data.regex;
		this.run = data.run;
	};
	test(text){
		if(this.name) {
			return text.trim().startsWith(this.name + ":");
		} else {
			return this.regex.match(text);
		};
	};
};

const BuiltIns = [
	new ChatButton({
		name: "copy",
		run: (text, color) => new Msg(" (✄)", (color == "aqua" ? "dark_aqua" : "aqua"), [
			P, new Msg("Click and copy", "gray")
		], `.copy ${text}`),
	}),
	new ChatButton({
		name: "yt",
		run: (text, color) => new Msg(" (►)", (color == "red" ? "dark_red" : "red"), [
			P, new Msg("Go to the youtube video", "gray")
			// TODO: add button for watching the video inside mc
		], text.slice(0, 11)),
	}),
	new ChatButton({
		name: "namemc",
		run: (text, color) => {
			let nick = text.split(" ")[0];
			let link = `https://namemc.com/profile/${nick}`;
			return [
				new Msg(" (ⓝ)", (color == "dark_gray" ? "gray" : "dark_gray"), [P, new Msg("Open the NameMC profile", "gray")], link),
				new Msg(" (☄)", (color == "gray" ? "dark_gray" : "gray"), [P, new Msg("Set as skin (/skin)", "gray")], null, "/skin set "+nick),
			];
		},
	}),
	new ChatButton({
		name: "skin",
		run: (text, color) => {
			let id = text.split(" ")[0];
			let link = "https://namemc.com/skin/"+id;
			let linkpng = "https://namemc.com/texture/"+id+".png?v=2";
			return [
				new Msg(" (✿)", (color == "blue" ? "dark_blue" : "blue"), [P, new Msg("Open the NameMC skin", "gray")], link),
				// TODO: use minotar/crafatar api or NPC's to show the skin ingame
				new Msg(" (☄)", (color == "green" ? "dark_green" : "green"), [P, new Msg("Download the skin", "gray")], linkpng),
			];
		},
	}),
	new ChatButton({
		name: "novaskin",
		run: (text, color) => {
			let id = text.split(" ")[0];
			let link = "https://minecraft.novaskin.me/skin/"+id;
			let linkpng = "http://novask.in/"+id+".png";
			return [
				new Msg(" (✿)", (color == "blue" ? "dark_blue" : "blue"), [
					P, new Msg("Open the Novaskin", "gray"),
				], link),
				new Msg(" (☄)", (color == "green" ? "dark_green" : "green"), [
					P, new Msg("Set as skin", "gray"),
				], null, `/skin set ${linkpng}`)
			];
		},
	}),
	new ChatButton({
		name: "mailto",
		run: (text, color) => new Msg(" (✉)", (color == "yellow" ? "gold" : "yellow"), [
			P, new Msg("Send essentials mail", "gray")
		], null, `/mail send ${text.split(" ")[0]} `),
	}),
];







module.exports = { ChatButtonHandler, ChatButton };