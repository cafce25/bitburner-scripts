let ns;
export default function server_(ns_) {
    ns = ns_;
    return {
        walk: walk,
        root: root,
        hackable: hackable,
        hackWorth: hackWorth,
        portHacksAvailable: portHacksAvailable,
    };
}

async function walk(host = "home", fun = defaultWalkAction) {
    let past = [];
    await walk_(fun, host, past, 0);
    return past;
}

async function defaultWalkAction(host, depth) {
    var prefix = "";
    while (depth-- > 0) {
        prefix += "--";
    }
    ns.tprint(`${prefix}-> ${host}`);
    //await ns.sleep(1000);
    return true;
}

async function walk_(fun, host, past, depth) {
    //ns.tprint(`walk_(fun, ${host}, ${past}, ${depth})`);
    if (past.includes(host)) return;
    past.push(host);
    //ns.tprint(`${host} ${past.length}`);
    if (await fun(host, depth)) {
        for (let newHost of ns.scan(host)) {
            await walk_(fun, newHost, past, 1 + depth);
        }
    }
}

function hackable(server) {
    if (!root(server)) return false;
    return ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(server);
}

function hackWorth(server) {
    if (!hackable(server)) return 0;
    if (server == "home") return 0;
    return ns.getServerMaxMoney(server) / calculateHackingTime(server, ns.getServerMinSecurityLevel(server));
}

function rootAll(servers) {
    for (var server of servers) {
        if (!root(server)) return false;
    }
}

function root(server, verbose = true) {
    if (ns.hasRootAccess(server)) return true;
    let portHacksRequired = ns.getServerNumPortsRequired(server);
    if (portHacksAvailable() < portHacksRequired) return false;
    else {
        if (verbose) {
            ns.tprint(`rooting ${server}`);
        }
        if (ns.fileExists("BruteSSH.exe", "home")  && 0 < portHacksRequired--) ns.brutessh(server);
        if (ns.fileExists("FTPCrack.exe", "home")  && 0 < portHacksRequired--) ns.ftpcrack(server);
        if (ns.fileExists("relaySMTP.exe", "home") && 0 < portHacksRequired--) ns.relaysmtp(server);
        if (ns.fileExists("HTTPWorm.exe", "home")  && 0 < portHacksRequired--) ns.httpworm(server);
        if (ns.fileExists("SQLInject.exe", "home") && 0 < portHacksRequired--) ns.sqlinject(server);
        ns.nuke(server);
        if (!ns.hasRootAccess(server)) {
            ns.tprint(`error rooting ${server}`);
            return false;
        }
    }
    return true;
}

function portHacksAvailable() {
    return ["BruteSSH", "FTPCrack", "relaySMTP", "HTTPWorm", "SQLInject"].reduce(
        (acc, program) => acc + ns.fileExists(program + ".exe", "home"), 0);
}

function calculateHackingTime(server, security = null, hack = null, int = null) {
    if (security == null) security = ns.getServerSecurityLevel(server);
    if (hack == null) hack = ns.getHackingLevel();
    //if (int == null) int = ns.getIntelligence(); // intelligence cannot be determined by provided functions?
    if (int == null) int = 0;
    const mults =  ns.getHackingMultipliers();
    
    const difficultyMult = ns.getServerRequiredHackingLevel(server) * security;

    const baseDiff      = 500;
    const baseSkill     = 50;
    const diffFactor    = 2.5;
    const intFactor     = 0.1;
    var skillFactor = (diffFactor * difficultyMult + baseDiff);
    // tslint:disable-next-line
    skillFactor /= (hack + baseSkill + (intFactor * int));

    const hackTimeMultiplier = 5;
    const hackingTime = hackTimeMultiplier * skillFactor / mults.speed;

    return hackingTime;
}