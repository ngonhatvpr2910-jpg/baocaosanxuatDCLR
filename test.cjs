const fs = require('fs');
const code = fs.readFileSync('App.tsx', 'utf8');

const regex = /\{([a-zA-Z0-9_.[\]]+)\}/g;
let match;
let vars = new Set();
while ((match = regex.exec(code)) !== null) {
  vars.add(match[1]);
}
console.log(Array.from(vars).join('\n'));
