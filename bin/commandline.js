const asyncs = [
    "sleep",
    "hack",
    "grow",
    "weaken",
];

export async function main(ns) {
    let d = document; // increase static ram usage so that bitburner does not complain
    if (ns.args.length < 1) {
        ns.tprint("give me a ns method to run");
        ns.exit();
    }
    let fn = ns.args.shift();
    
    if (!Object.keys(ns).includes(fn)) {
        ns.tprint(`${fn} is not a ns function`);
        ns.exit();
    }
    
    let result = ns[fn](...ns.args);
    if (asyncs.includes(fn)) result = await result;
    
    ns.tprint(JSON.stringify(result));
}