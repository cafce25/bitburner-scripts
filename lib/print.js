let ns;
export async function main(ns_) {
    ns = ns_;
    styleprint(...ns.args);
}

//add custom html to get output in my color
function colorprint(text = "", color = "#00ff00") {
    styleprint(text, `hyphens:none; color:${color}`);
}

function styleprint(text = "", thisStyle = "hyphens:none; color:#00ff00") {
    ns.tprint(
        //start our own terminal-line
        `</td></tr><tr class="posted"><td class="terminal-line">` +  
        style(text.toString(), thisStyle)
    );
}

function style(text, style) {
    return `<span style="${style}">${text}</span>`;
}

export default function(ns_) {
    ns = ns_;
    return {
        colorprint,
        styleprint,
        style,
    };
}