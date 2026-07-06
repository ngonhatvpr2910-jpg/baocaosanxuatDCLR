const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(/formatter=\{\(v\) =>/g, 'formatter={(v: any) =>');
code = code.replace(/formatter=\{\(value\) => \[`\$\{Number\(value\)\.toLocaleString\(\)\} VND/g, 'formatter={(value: any) => [`${Number(value).toLocaleString()} VND');

fs.writeFileSync('App.tsx', code);
