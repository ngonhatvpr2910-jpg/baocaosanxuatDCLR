const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

let lines = code.split('\n');
lines.splice(1631, 26);

fs.writeFileSync('App.tsx', lines.join('\n'));
