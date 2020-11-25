let UPLOAD_PORT = 20;
const debug = !true;
let ns, ws;
const handleMessage = {
    file: (message) => {
        let filename = message.file.name;
        if (filename.includes("/")) {
            filename = "/" + filename;
        }
        if (!/\.(js|ns|txt|script)$/.test(filename)) {
            if (debug) {
                ns.tprint("Received non supported file, ignoring...");
            }
            return;
        }
        ns.tprint("Received '" + filename + "'");
        ns.write(filename, message.file.data, "w");
    },
    delete: (message) => {
        let filename = message.filename;
        if (filename.includes("/")) {
            filename = "/" + filename;
        }
        if (/\.(msg)$/.test(filename)) {
            if (debug) {
                ns.tprint("Received non supported file, ignoring...");
            }
            return;
        }
        ns.tprint("Deleting '" + JSON.stringify(filename) + "'");
        if (!ns.rm(filename, "home")) {
            ns.tprint("error deleting file");
        }
    }
}

export async function main(ns_) {
    ns = ns_;
    ns.disableLog("ALL");
    UPLOAD_PORT = ns.getPortHandle(UPLOAD_PORT);
    ws = new WebSocket("wss://localhost:4747");

    ws.onclosed = function(event) {
        ns.tprint("Connection to fs closed!");
        ns.exit();
    };
    ws.onerror = function(event) {
        ns.tprint("Error connecting to fs!");
        ns.exit();
    };

    ws.onmessage = function(event) {
        let message;
        try {
            message = JSON.parse(event.data);
        }
        catch (e) {
            ns.tprint("Misshaped message received from websocket!");
            return;
        }
        
        if (debug) {
            ns.tprint(event.data);
        }
        handleMessage[message.type](message);
    };

    while (true) {
        while (!UPLOAD_PORT.empty()) {
            let message = JSON.parse(UPLOAD_PORT.read());
            if (
                "object" !== typeof message ||
                "string" !== typeof message.type ||
                message.type !== "upload file"
            ) {
                if (debug) {
                    ns.tprint(
                        "Writing Message:" + 
                        JSON.stringify(message, undefined, 41)
                    );
                }
                
                UPLOAD_PORT.write(message);
                await ns.sleep(100);
                continue;
            }
            
            uploadFile(message.filename);
        }
        await ns.sleep(1000);
    }
}

function uploadFile(filename) {
    let message = {
        "type": "file",
        "file": {
            "name": filename,
            "data": ns.read(filename, "home"),
        }
    };
    ws.send(JSON.stringify(message));
}
