/* Plasma Client | Constants */

const ConfigTypeMap = {
	clickPm: { type: "bool", default: true, description: "Use a message command when you click someone's username in chat." },
	clickPmCommand: { type: "string", default: "msg", description: "The message command that will be used when you click an username. Example: When you click 'Adam_', the chatbox gets filled with '/msg Adam_ '" },
	autoLogin: { type: "bool", default: false, description: "Let Plasma type in your saved passwords for you" },
	autoSavePasswords: { type: "bool", default: false, description: "Save /login passwords when you type them" },
	prefix: { type: "string", default: "." },
	nonPrefixDetection: { type: "bool", default: true, description: "If the prefix is '.', send the full message when it is '...', './give' or '._.' etc..." },
};



module.exports = {
	ConfigTypeMap,
};