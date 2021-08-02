/* Plasma Client | Msg */

/* You are allowed to use this code :3 -dennis */

class Msg {
	constructor(text, color, hover, click, suggest){
		if(text) this.text(text);
		if(color) this.color(color);
		if(hover) this.hover(hover);
		if(click) this.click(click);
		if(suggest) this.suggest(suggest);
		return this;
	};
	text(t){
		this._text = t;
		return this;
	};
	color(color){
		this._color = color;
		return this;
	};
	hover(text){
		this._hover = text;
		return this;
	};
	suggest(text){
		this._click = text;
		this._clickAction = "suggest_command";
		return this;
	};
	click(text){
		this._click = text;
		this._clickAction = "run_command";
		if(text.startsWith("http")) this._clickAction = "open_url";
		return this;
	};
	bold(isBold = true){
		this._bold = isBold;
	};
	italic(italic = true){
		this._italic = italic;
	};
	toJSON(){
		return {
			text: this._text,
			color: this._color,
			bold: this._bold,
			italic: this._italic,
			hoverEvent: this._hover ? {
				action: "show_text",
				value: this._hover,
			} : undefined,
			clickEvent: this._click ? {
				action: this._clickAction,
				value: this._click,
			} : undefined,
		};
	};
};

module.exports = Msg;