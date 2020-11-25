import serverTools from "/lib/server.js";
let ns, st;

function init(ns_) {
    ns = ns_;
    st = serverTools(ns_);
    ns.disableLog("ALL");
}

export async function main(ns) {
    init(ns);
    let servers = [];
    await st.walk("home", (server, depth) => {
        servers.push(server);
        return true;
    });
    let target = [];
    let ports = st.portHacksAvailable();
    //sort servers by hackworth
    while (true) {
        servers.sort(compareServers);
        if (!arrayEquals(target, servers.slice(0,1)) || ports != st.portHacksAvailable()) {
            ports = st.portHacksAvailable();
            ns.print("retargeting");
            let oldTarget = target;
            target = servers.slice(0,1);
            retarget( servers, oldTarget, target);
        }
        await ns.sleep(1000);
    }
}

function retarget( servers, oldT, newT) {
    for (let server of servers) {
        if (server == "home") continue;
        runWorkers(newT[0], server, "/lib/worker/smart.js", 1, 1.5, 0.9);
    }
}

function runWorkers(
target, server, worker, threadFactor,
 securityFactor, moneyFactor, verbose = true) {
    let securityThreshold = ns.getServerMinSecurityLevel(target) * securityFactor;
    let moneyThreshold = ns.getServerMaxMoney(target) * moneyFactor;
    let threads = Math.floor(
        ns.getServerRam(server)[0] * threadFactor /
        ns.getScriptRam(worker)
    );
    
    if (threads <= 0 || !st.root(server)) return;
    let pid;
    
    
    ns.scp(worker, server);
    if (server == ns.getHostname()) {
        ns.spawn(worker, threads, target, securityThreshold, moneyThreshold);
    } else {
        ns.killall(server);
        pid = ns.exec(
            worker, server, threads, target,
            securityThreshold, moneyThreshold
        );
    }
    if (verbose) {
        if (pid > 0) {
            ns.print(
                `started worker(${pid}) with ${threads} threads` +
                ` on ${server} hacking ${target}`
            );
        } else {
            ns.print(`failed to start workers on ${server}`);
        }
    }
}

function arrayEquals(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}

function compareServers( a, b) {
    return st.hackWorth(b) - st.hackWorth(a);
}

function printServers(servers) {
    let i = 0;
    for (let server of servers) {
        ns.print(`${i++}: ${server} ${ns.hasRootAccess(server)?"Y":"N"} ${st.hackWorth(server.name)}`);
    }
}