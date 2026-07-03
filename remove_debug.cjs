const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

content = content.replace(/let renderCount = 0;[\s\S]*?const useDebugRender[\s\S]*?console\.trace\(\);\n  \}\n};\n/, '');
content = content.replace(/  useDebugRender\("App"\);\n/, '');

fs.writeFileSync('App.tsx', content);
