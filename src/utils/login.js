/* Plasma Client */

/*
-- Note @ dennis ---
Why does this even exist again? ITS JUST 2 PACKETSS
*/

module.exports = (plasma, client) => {
	client.write('login', {
		entityId: plasma.clientEntityId ?? 0,
		levelType: 'default',
		gameMode: 0,
		dimension: 0,
		difficulty: 2,
		maxPlayers: 1,
		reducedDebugInfo: false
	});
	client.write('position', {
		x: 0,
		y: 1.62,
		z: 0,
		yaw: 0,
		pitch: 0,
		flags: 0x00
	});
};