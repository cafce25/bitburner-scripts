export async function main(ns) {
    let [server, securityThreshold, moneyThreshold] = ns.args;
    while (true) {
        if (ns.getServerSecurityLevel(server) > securityThreshold) {
            await ns.weaken(server);
        } else if (ns.getServerMoneyAvailable(server) < moneyThreshold) {
            await ns.grow(server);
        } else {
            await ns.hack(server);
        }
    }
}