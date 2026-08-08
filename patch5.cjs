const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

let target1 = `onChange={(e) => updateScrapMetric("weekly", idx, e.target.value)}`;
let repl1 = `onChange={(e) => updateScrapMetric("weekly", w.week, e.target.value)}`;
code = code.replace(target1, repl1);

let target2 = `onChange={(e) => updateDclrErrorMetric("weekly", idx, e.target.value)}`;
let repl2 = `onChange={(e) => updateDclrErrorMetric("weekly", w.week, e.target.value)}`;
code = code.replace(target2, repl2);

fs.writeFileSync('App.tsx', code);
