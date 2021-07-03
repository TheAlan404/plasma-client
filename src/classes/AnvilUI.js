/* Plasma Client | AnvilUI */
const { EventEmitter } = require("events");

class AnvilUI extends EventEmitter {
    constructor(data = {}){
        super();
        const {
            title = "Title",
            placeholder = "",
            confirm = "Ok",
            cancel = null,
        } = data;
        this.title = title;
        this.placeholder = AnvilUI.parseItem(placeholder);
        this.confirm = AnvilUI.parseItem(confirm);
        this.cancel = AnvilUI.parseItem(cancel);
    };
    init(client){
        client.write('open_window', {
            windowId: 10,
            inventoryType: 'minecraft:anvil',
            windowTitle: JSON.stringify(this.title),
            slotCount: 0,
        })
        client.write('window_items', {
            windowId: 10,
            items: [
                this.placeholder,
                this.cancel,
                this.confirm,
            ]
        })
    };
    static parseItem(item){
        if(typeof item == "string") {
            return AnvilUI.parseItem([1, item, []]);
        };
        if(Array.isArray(item)) {
            const [ id = 1, name = "Text", lores = [] ] = item;
            let displayValue = {
                Name: {
                    type: "string",
                    value: name,
                },
                ...(lores.length ? {
                    Lore: {
                        type: "list",
                        value: {
                            type: "string",
                            value: lores,
                        },
                    },
                } : {}),
            };
            return {
                blockId: id,
                itemCount: 1,
                itemDamage: 0,
                nbtData: {
                    name: "",
                    type: "compound",
                    value: {
                        display: {
                            type: "compound",
                            value: displayValue,
                        },
                    },
                },
            };
        };
        return item;
    };
};