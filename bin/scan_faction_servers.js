import st_ from "/lib/server.js";
let ns, st;
let factionServers = [
    "I.I.I.I", //BlackHand
    "avmnite-02h", //NiteSec
    "CSEC",
    "run4theh111z",
    "fulcrumassets",
];
function init(ns_) {
    ns = ns_;
    st = st_(ns);
}
export async function main(ns) {
    init(ns);
    if (ns.args.length > 0) {
        factionServers = ns.args;
    }
    await st.walk("home", wf);
}

let path = [];
function wf(server, depth) {
    path.length = depth;
    path.push(server);
    if (factionServers.includes(server)) ns.tprint(path.join(" -> "));
    return true;
}