import st_ from "/lib/server.ns";
let ns, st;
function init(ns_) {
    ns = ns_;
    st = st_(ns);
}
export async function main(ns) {
    init(ns);
    await st.walk("home", (s, d) => {
        for (let file of ns.ls(s, ".lit")) {
            ns.scp(file, s, "home");
        }
        return true;
    });
}