const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');
code = code.replace(
  'const isLocked = isPast || isCurrent;',
  'const isLocked = (isPast || isCurrent) && !(historyYear === 2026 && m.month === 7);'
);
fs.writeFileSync('App.tsx', code);
