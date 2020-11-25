const daemons = ["governor", "tixd", "updated"];
const daemonsFolder = "/bin/daemons/";
let ns;

export async function main(ns_) {
    ns = ns_;
    ns.disableLog("ALL");
    await Promise.all([
        startDaemons(daemons, daemonsFolder),
        setupPrograms(),
        setupHacknet(),
        ns.sleep(20000),
    ]);
}

async function startDaemons(daemons, folder) {
    for (let daemon of daemons) {
        let script = folder + daemon + ".js"
        if (!ns.scriptRunning(script, "home")) {
            ns.scriptKill(script, "home");
            let pid = ns.run(script);
            if (pid <= 0) ns.tprint(`could not start '${script}'`);
        }
    }
}

async function setupPrograms() {
    const programs = [
        {n:"BruteSSH",       p: 5e5,   d:"Opens up SSH Ports"},
        {n:"FTPCrack",       p: 15e5,  d:"Opens up FTP Ports"},
        {n:"relaySMTP",      p: 5e6,   d:"Opens up SMTP Ports"},
        {n:"HTTPWorm",       p: 3e7,   d:"Opens up HTTP Ports"},
        {n:"SQLInject",      p: 25e7,  d:"Opens up SQL Ports"},
        {n:"DeepscanV1",     p: 5e5,   d:"Enables 'scan-analyze' with a depth up to 5"},
        {n:"DeepscanV2",     p: 25e6,  d:"Enables 'scan-analyze' with a depth up to 10"},
        {n:"AutoLink",       p: 1e6,   d:"Enables direct connect via 'scan-analyze'"},
        {n:"ServerProfiler", p: 1e6,   d:"Displays hacking and Netscript-related information about a server"},
    ];
    programs.sort((a, b) => a.p - b.p);
    try {
        while (!(ns.scan("home").includes("darkweb") || ns.purchaseTor())) {
            await ns.sleep(1000);
        }
        ns.print("bought Tor");
    }
    catch (e) {
        ns.tprint("cannot buy tor, maybe you're missing the sourcefile?");
        return;
    }
    for (let program of programs) {
        if (!ns.fileExists(program.n + ".exe", "home")) {
            while (ns.gelServerMoneyAvailable("home") < program.p + 1e6) {
                await ns.sleep(5e3);
            }
            if(ns.purchaseProgram(program.n + ".exe")) {
                ns.print(`bought ${program.n}.exe`);
            }
        }
    }
}

function getCosts() {
    let costs = [];
    let hn = ns.hacknet;
    if (hn.numNodes() < 8) costs.push({t: "p", c: hn.getPurchaseNodeCost()});
    for (let i = 0; i < hn.numNodes(); ++i) {
        let l = hn.getLevelUpgradeCost(i, 1);
        let r = hn.getRamUpgradeCost(i, 1);
        let c = hn.getCoreUpgradeCost(i, 1);
        if (isFinite(l)) costs.push({t: "l", c: l, i});
        if (isFinite(r)) costs.push({t: "r", c: r, i});
        if (isFinite(c)) costs.push({t: "c", c: c, i});
    }
    costs.sort((a, b) => {
        if (a.c !== b.c) return a.c - b.c;
        if (a.t === "p" || b.t === "p") return (a.t === "p")? -1: 1;
        return a.i - b.i;
    });
    return costs;
}

async function setupHacknet() {
    let invested = 0;
    let hn = ns.hacknet;
    let costs = getCosts();
    while (costs.length > 0) {
        const s = ns.sleep(1000);
        let purchase = false;
        costs.sort((a, b) => {
            if (a.c == b.c) return a.i - b.i;
            return a.c - b.c;
        });
        let cost = costs.shift();
        while (cost.c + invested * 100 > ns.getServerMoneyAvailable("home")) {
            await ns.sleep(1000);
        }
        let i, c;
        invested += cost.c;
        switch (cost.t) {
            case "p":
                hn.purchaseNode();
                ns.print(`purchased node ${hn.numNodes()}`);
                purchase = true;
                break;
            case "l":
                i = cost.i;
                hn.upgradeLevel(i, 1);
                ns.print(`purchased level for node ${i}`);
                c = hn.getLevelUpgradeCost(i);
                if (isFinite(c)) costs.push({t: "l", c, i});
                purchase = true;
                break;
            case "r":
                i = cost.i;
                hn.upgradeRam(i, 1);
                ns.print(`purchased ram for node ${i}`);
                c = hn.getRamUpgradeCost(i);
                if (isFinite(c)) costs.push({t: "r", c, i});
                purchase = true;
                break;
            case "c":
                i = cost.i;
                hn.upgradeCore(i, 1);
                ns.print(`purchased core for node ${i}`);
                c = hn.getCoreUpgradeCost(i);
                if (isFinite(c)) costs.push({t: "c", c, i});
                purchase = true;
                break;
        }
        costs = getCosts();
        if (!purchase) await s;
    }
}
