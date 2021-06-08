/* Plasma Client */

module.exports = (plasma, client) => {
	/**
	* Send a chat message to the client
	* @param {Chat} components
	*/
	client.chat = (components) => {
		client.write("chat", { message: JSON.stringify(components) });
	};
	
	/**
	* Send a chat message prefixed with [Plasma]
	* @param {Chat} text
	* @param {string} [color] - only takes effect if text is a string
	*/
	client.notify = (text, color) => {
		let msg;
		if(Array.isArray(text)) {
			msg = [{text:"[Plasma] ",color:"dark_aqua"}, ...text];
		} else if(typeof text != "string") {
			msg = text;
		} else {
			msg = [{text:"[Plasma] ",color:"dark_aqua"},{text:text,color:(color||"gray")}];
		};
		client.chat(msg);
	};
};