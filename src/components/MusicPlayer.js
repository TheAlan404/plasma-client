const { SongPlayer } = require("nmp-player");
const { EventEmitter } = require("events");
const { ProxyFilter } = require("@Proxy");
const Msg = require("@Msg");

const P = new Msg("[P] ", "dark_aqua");
const NOTE_CHAR = "♬";

class MusicPlayer extends EventEmitter {
	constructor(plasma){
		super();
		this.plasma = plasma;
		
		this.bossbar = null; // TODO
		this.initSongPlayer();
	};
	
	initSongPlayer(){
		this._player = new SongPlayer();
		this._player._note = (packet) => {
			this.plasma.sendNote(packet);
			//this.bossbar.setPercentage(songPlayer.tick, songPlayer.song.length);
		};
		this._player.on("stop", () => {
			this.plasma.chat([P, new Msg("Music stopped.", "gray")]);
			//this.bossbar.setTitle([new Msg(NOTE_CHAR, "dark_gray"), " Stopped - ", new Msg((songPlayer.song.title), "gold")]);
			this.removeBossbar();
		});
		this._player.on("end", () => {
			this.plasma.chat([P, new Msg("Music ended.", "gray")]);
			//this.bossbar.setTitle([new Msg(NOTE_CHAR, "dark_gray"), " Finished - ", new Msg((songPlayer.song.title), "gold")]);
			this.removeBossbar();
		});
	};
	
	initCommands(){
		this.plasma.addCommand({
			name: "music",
			aliases: ["m"],
			run: () => {}, // TODO
		});
	};
	
	removeBossbar(){
		// TODO
		// note: use setTimeout etc
	};
	
	static songToChat(song){
		return [
			new Msg("Song Title: ", "white"),      new Msg(song.title || "<No title>", "gold"), "\n",
			new Msg("Author: ", "white"),          new Msg(song.author || "<Unknown>", "gold"), "\n",
			new Msg("Description: ", "white"),     new Msg(song.description || "<None>", "gold"), "\n",
			new Msg("Original Author: ", "white"), new Msg(song.original_author || "<Unknown/None>", "gold"), "\n",
			new Msg("Imported Name: ", "white"),   new Msg(song.imported_name || "<None>", "gold"), "\n",
			new Msg("Tempo: ", "white"),           new Msg(song.tempo+"/tps", "gold"),
		];
	};
};

module.exports = { MusicPlayer };