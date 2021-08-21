# ✧ Plasma Client

Welcome to Plasma Client

its not really a client but a proxy, but who cares lol

## Install

**Requirements**
- NodeJS

With git:
```
git clone https://github.com/thealan404/plasma-client
npm i
```
If you dont have git, just download the zip file then extract it.

**How to run:**
```
node index.js # New rewrite
node plasma.js # old unstable unmaintained version
```

After you see this message:
```
[Plasma] Ready! Login to localhost to use Plasma.
```
Go to the minecraft client of your choice, for example vanilla, then connect to `localhost`

# Features

- Proxy filter API for devs
- Automatic `/tpaccept`
- 

# TODO

**other normal stuff**
- [ ] (chore) Make (a not shitty) readme
- [x] (chore) Install guide
- [ ] (chore) presentation/user guide
- [ ] (core) plugins api
- [x] (core) use module-alias
- [ ] (core) fix package.json
- [ ] (core) probably move `P`, `MEDAL_INFO` and `MEDAL_ALERT` to `Msg.something` idk
- [ ] (core) implement a logger for loglevels
- [ ] (component) auto login
- [x] (component) chat buttons
- [ ] (component) chat log etc
- [ ] (component) chat message shortcuts ('.,' in the chat? custom command for listing it?) (use clickable chat buttons lol)
- [x] (component) fast pm
- [x] (component) auto tpaccept
- [ ] (component) highlights
- [ ] (component) maps
- [ ] (component) elevators
- [ ] (component) npcs
- [ ] (component) wss
- [ ] (component) holograms
- [ ] (feat) keep equipment on creative inventory clear
- [ ] (proxy) client settings
- [ ] (proxy) target client save list of players
- [x] (proxy) Entity ID swapping
- [x] (proxy) handle disconnects
- [ ] (proxy) unload stuff on disconnect
- [ ] (proxy) targetClient chat message queue (and custom queue times etc)
- [ ] (proxy+ui) list clients in main menu
- [ ] (ui) better classes
- [x] (ui) buttons API
- [x] (ui) better console input in main menu
- [ ] (util) console chat scrollback
- [ ] (cmds) better classes
- [ ] (cmds) tab-completion
- [ ] (cmds) better. usage. strings. please.
- [ ] (music) import music module
- [ ] (music) add replaying
- [ ] (music) list of directories
- [ ] (music) implement playlists
- [ ] (music) add loop modes

# Contributors Needed
...because dennis fucking sucks at coding shit

- [ ] [This config helper thing which handles type check shit](./src/classes/ConfigHelper.js)
- [ ] [This chat listener thing which is the worst api ever(and is broke too)](./src/classes/ChatListener.js)
- [ ] the [command handler](./src/commands/Handler.js) itself, api good but implementation very bad pls fix

accually you can contribute to any file, its really appreciated!

**some symbols i copy often, please ignore**
- ⚧
- ♂
- ♀