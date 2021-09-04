class PlasmaSocket {
	constructor(plasma){
		this.plasma = plasma;
		
		this._socket = null; // socket.io socket instance
		
		this._bindEvents();
	};
	_bindEvents(){
		// do socket.on() stuff here
	};
	
	createMessage(message){};
	
	createChannel(){};
};

module.exports = PlasmaSocket;