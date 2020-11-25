let ns;
export default function init(_ns) {
    ns = _ns;
    return fs;
}
    
const fs = {}; 

fs.mkdir = function(filepath, opts, cb) {
    if ("undefined" === typeof cb) {
        cb = opts;
        opts = {};
    }
    cb();
    return;
};

fs.rmdir = function(filepath, opts, cb) {
    if ("undefined" === typeof cb) {
        cb = opts;
        opts = {};
    }
    cb();
    return;
};

fs.readdir = function(filepath, opts, cb) {
    if ("undefined" === typeof cb) {
        cb = opts;
        opts = {};
    }
    if (filepath.endsWith("/")) {
        filepath = filepath.slice(0,-1);
    }
    if (!filepath.startsWith("/")) {
        filepath = "/" + filepath;
    }
    let files = ns.ls("home"); //todo for other servers
    let contents = [];
    for (let f of files) {
        if (!f.startsWith("/")) f = "/" + f;
        if (!f.startsWith(filepath)) continue;
        f = f.slice(filepath.length);
        if (!filepath.endsWith("/") && !f.startsWith("/")) continue;
        if (f.startsWith("/")) f = f.slice(1);
        f = f.split("/", 2)[0];
        if (!contents.includes(f)) contents.push(f);
    }
    cb(contents);
    return;
};

fs.writeFile = function(filepath, data, opts, cb) {
    if ("undefined" === typeof cb) {
        cb = opts;
        opts = {};
    }
    ns.write(filepath, data, opts.rwa).then((_) => {
        cb();
    });
    return;
};

fs.readFile = function(filepath, opts, cb) {
    if ("undefined" === typeof cb) {
        cb = opts;
        opts = {};
    }
    ns.read(filepath).then((data) => {
        cb(data);
    });
};

fs.unlink = function(filepath, opts, cb) {
    if ("undefined" === typeof cb) {
        cb = opts;
        opts = {};
    }
    ns.rm(filepath)
    cb();
};

fs.rename = function(oldFilepath, newFilepath, cb) {
    fs.readFile(oldFilepath, (data) => {
        fs.writeFile(newFilepath, data, {rwa: "w"}, (a) => {
            fs.unlink(oldFilepath, (b) => {
                cb();
            });
        });
    });
};

fs.stat = function(filepath, opts, cb) {
    if ("undefined" === typeof cb) {
        cb = opts;
        opts = {};
    }
    let files = ns.ls("home"); //todo for other servers
    files = files.map((f) => (f.startsWith("/")?"":"/") + f);
    
    fs.du(filepath, (size) => {
        let stat = {
            type: files.includes(filepath)?"file":"dir",
            size: size,
            uid:1,
            gid:1,
            dev:255,
        };
        cb(stat);
    });
};

fs.lstat = fs.stat;

fs.symlink = function(target, filepath, cb) {
    fs.readFile(filepath, (data) => {
        fs.writeFile(target, data, {rwa:"w"}, () => {
            cb();
        });
    });
};

fs.readlink = function(filepath, opts, cb) {
    if ("undefined" === typeof cb) {
        cb = opts;
        opts = {};
    }
    cb(filepath);
};

fs.du = function(filepath, cb) {
    fs.readFile(filepath, (data) => cb(data.length));
};

fs.promises = {};

fs.promises.mkdir = function(...args) {
    return new Promise((resolve, reject) => {
        fs.mkdir(...args, () => resolve());
    });
};
fs.promises.rmdir = function(...args) {
    return new Promise((resolve, reject) => {
        fs.rmdir(...args, () => resolve());
    });
};
fs.promises.readdir = function(...args) {
    return new Promise((resolve, reject) => {
        fs.readdir(...args, (entities) => resolve(entities));
    });
};
fs.promises.writeFile = function(...args) {
    return new Promise((resolve, reject) => {
        fs.writeFile(...args, () => resolve());
    });
};
fs.promises.readFile = function(...args) {
    return new Promise((resolve, reject) => {
        fs.readFile(...args, (data) => resolve(data));
    });
};
fs.promises.unlink = function(...args) {
    return new Promise((resolve, reject) => {
        fs.readFile(...args, () => resolve());
    });
};
fs.promises.rename = function(...args) {
    return new Promise((resolve, reject) => {
        fs.rename(...args, () => resolve());
    });
};
fs.promises.stat = function(...args) {
    return new Promise((resolve, reject) => {
        fs.stat(...args, (s) => resolve(s));
    });
};
fs.promises.lstat = fs.promises.stat;
fs.promises.symlink = function(...args) {
    return new Promise((resolve, reject) => {
        fs.stat(...args, () => resolve());
    });
};
fs.promises.readlink = function(...args) {
    return new Promise((resolve, reject) => {
        fs.readlink(...args, (l) => resolve(l));
    });
};
fs.promises.du = function(...args) {
    return new Promise((resolve, reject) => {
        fs.du(...args, (s) => resolve(s));
    });
};