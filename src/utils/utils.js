/* Plasma Client | Utils */

const NicknameRegex = /^\w{3,16}$/i;
module.exports.validateNick = (nick) => {
	return NicknameRegex.test(nick);
};