const io = require("socket.io-client");
const chalk = require("chalk");

class PlasmaSocket {
	constructor(plasma){
		this.plasma = plasma;
		
		this._socket = io('domainsoon', { auth: { username: '', password: ''}}); // dennis do funne thing here
		
		this._bindEvents();
	};
	_bindEvents(){
        this._socket.on('roomCreated', (msg) => {
            console.log(chalk.yellow('[SERVER]') + chalk.blue(`${msg.message}`))
        });

        this._socket.on('messageCreate', (msg) => {
            console.log(chalk.yellow(`[${msg.messageAuthorName}]`) + chalk.blue(`${msg.content}`))
        });

        this._socket.on('userJoined', (msg) => {
            console.log(chalk.yellow(`[SERVER]`) + chalk.blue(`${msg.message}`))
        });

        this._socket.on('userLeft', (msg) => {
            console.log(chalk.yellow(`[SERVER]`) + chalk.blue(`${msg.message}`))
        });

    };
	
	createMessage(message) {
        this._socket.emit('createMessage', message);
    };
	
	createChannel() {
        this._socket.emit('createRoom');
    };

    joinChannel(channelId) {
        this._socket.emit('joinRoom', channelId);
    }

    leaveChannel() {
        this._socket.emit('leaveRoom');
    }

    createAccount(username, password) {
        this._socket.emit('register', { username, password});
    }
};

module.exports = PlasmaSocket;
