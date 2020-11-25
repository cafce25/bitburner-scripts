const UPDATE_PORT_NR = 20;
export async function main(ns) {
    let UPDATE_PORT = ns.getPortHandle(UPDATE_PORT_NR);
    if (ns.args.length === 0) {
        ns.args = ns.ls("home").filter(fn => {
            return /\.(js|ns|script|txt)$/.test(fn);
        });
    }
    for (let filename of ns.args) {
        UPDATE_PORT.write(JSON.stringify(
            {type: "upload file", filename}
        ));
    }
}