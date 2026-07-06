const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');
const lines = code.split('\n');
for(let i=1450; i<1570; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
