const clip = require("clipboardy");

module.exports = (handler) => {
	handler.addCommand({
		name: "copy",
		hideInput: true,
		args: [":text"],
		category: "util",
		desc: "Copies a text to clipboard",
		run: (args, plasma) => {
			let text = args.join(" ").trim();
			if(!text) return;
			clip.writeSync(text);
		},
	});
};