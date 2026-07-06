const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');
code = code.replace(/const uniqueShiftWorkersMap = \{\};/, 'const uniqueShiftWorkersMap: Record<string, number> = {};');
fs.writeFileSync('App.tsx', code);
