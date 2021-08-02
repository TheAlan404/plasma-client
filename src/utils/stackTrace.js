Error.stackTraceLimit = Infinity;

module.exports = function getPluginFromStack(depth = 0){
	return new Error("a").stack.split("\n")[3 + depth].trim();
};