const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const regex = /        \}\n      \}\n      \n      return m;\n    \}\);\n\n    return updated;/;
code = code.replace(regex, `        }\n      }\n      }\n      \n      return m;\n    });\n\n    return updated;`);

fs.writeFileSync('App.tsx', code);
