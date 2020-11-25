import st_ from "/lib/server.js";
let ns, st;
function init(ns_) {
    ns = ns_;
    st = st_(ns);
}
export async function main(ns) {
    init(ns);
    await st.walk();
}