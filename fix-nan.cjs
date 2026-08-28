const fs = require('fs');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\{kpis\.([a-zA-Z0-9_]+)\}/g, '{Number.isNaN(kpis.$1) ? 0 : kpis.$1}');
  fs.writeFileSync(file, content);
}

processFile('DashboardTab.tsx');
processFile('App.tsx');
