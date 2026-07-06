const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// replace value={foo !== undefined ? foo : ""} with value={foo !== undefined && !Number.isNaN(foo) ? foo : ""}
code = code.replace(/value=\{([a-zA-Z0-9_.\[\]]+) !== undefined \? \1 : ""\}/g, 'value={$1 !== undefined && !Number.isNaN($1) ? $1 : ""}');

// replace value={foo === null ? "" : foo} with value={foo === null || Number.isNaN(foo) ? "" : foo}
code = code.replace(/value=\{([a-zA-Z0-9_.\[\]]+) === null \? "" : \1\}/g, 'value={$1 === null || Number.isNaN($1) ? "" : $1}');

// replace value={foo === null ? "" : foo.toLocaleString()} with value={foo === null || Number.isNaN(foo) ? "" : foo.toLocaleString()}
code = code.replace(/value=\{([a-zA-Z0-9_.\[\]]+) === null \? "" : \1\.toLocaleString\(\)\}/g, 'value={$1 === null || Number.isNaN($1) ? "" : $1.toLocaleString()}');

// Fix prodFormFactor and prodFormPrice
code = code.replace(/value=\{prodFormFactor\}/g, 'value={Number.isNaN(prodFormFactor) ? "" : prodFormFactor}');
code = code.replace(/value=\{prodFormPrice\}/g, 'value={Number.isNaN(prodFormPrice) ? "" : prodFormPrice}');

// Fix monthlyTargets[x] || 110
code = code.replace(/value=\{monthlyTargets\[([^\]]+)\] \|\| 110\}/g, 'value={Number.isNaN(monthlyTargets[$1]) ? 110 : (monthlyTargets[$1] || 110)}');

fs.writeFileSync('App.tsx', code);
