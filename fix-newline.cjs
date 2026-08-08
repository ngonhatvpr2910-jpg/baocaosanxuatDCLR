const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(/\\nexport function getStandardYearWeeks/g, '\nexport function getStandardYearWeeks');

fs.writeFileSync('App.tsx', code);
