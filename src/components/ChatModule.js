const { ProxyFilter } = require("@Proxy");
const Msg = require("@Msg");

const P = new Msg("[P] ", "dark_aqua");

class ChatModule {
	constructor(plasma){
		this.plasma = plasma;
		
		this.plasma.proxy.addFilter("recieve", "chat", new ProxyFilter({
			type: "READ",
			filter: (data) => {
				// TODO: parse message and do better tpa request detection
				if(data.message.includes("/tpaccept") /*&& this.plasma.config.get("autotpaccept")*/)
					this.plasma.proxy.targetClient.write("chat", { message: "/tpaccept" });
				return data;
			},
			label: "plasma auto tpaccept",
		}));
		
		this.plasma.proxy.addFilter("recieve", "chat", new ProxyFilter({
			type: "MODIFY",
			filter: (data) => {
				try {
					let comp = JSON.parse(data.message);
					if(Array.isArray(comp)) {
						comp = comp.map(this._clickPm.bind(this));
					} else if(typeof comp === "object") {
						if(comp.extra) {
							comp.extra = comp.extra.map(this._clickPm.bind(this));
						};
					};
					return { message: JSON.stringify(comp) };
				} catch (e) {
					this.plasma.handleError(e);
					return data;
				};
			},
			label: "plasma clickpm",
		}));
	};
	_clickPm(comp, i, all){
		if(typeof comp == "string" || !comp.text) return comp;
		if(!comp.text.trim().match(/^[A-Za-z0-9_]{3,16}$/)) return comp;
		let nick = comp.text.trim();
		if(
			/*this.plasma.config.get("clickPm")
			&&*/ this.plasma.proxy.targetClient.proxy.playerList.has(nick)
			&& !comp.clickEvent
		) {
			comp.clickEvent = {
				action: "suggest_command",
				value: `/${/*this.plasma.config.get("clickPmCommand") ||*/ "msg"} ${nick} `,
			};
			comp.hoverEvent = {
				action: "show_text",
				value: [P, new Msg("Fast message: Click", "gray")],
			};
		};
		return comp;
	};
};








module.exports = { ChatModule };