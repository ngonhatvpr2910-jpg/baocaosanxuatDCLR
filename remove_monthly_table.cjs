const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const regex = /<tr key="scr-month-header"[\s\S]*?<\/tr>[\s\S]*?<tr key="scr-month-values"[\s\S]*?<\/tr>/g;
code = code.replace(regex, '');

fs.writeFileSync('App.tsx', code);
