const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const content = fs.readFileSync('App.tsx', 'utf8');
const ast = parser.parse(content, {
  sourceType: 'module',
  plugins: ['typescript', 'jsx']
});

traverse(ast, {
  CallExpression(path) {
    if (path.node.callee.name && (path.node.callee.name === 'useState' || path.node.callee.name === 'useEffect' || path.node.callee.name === 'useMemo' || path.node.callee.name === 'useRef')) {
      let functionPath = path.getFunctionParent();
      if (!functionPath) {
         console.log(`Hook ${path.node.callee.name} at line ${path.node.loc.start.line} is outside any function!`);
      } else {
         let name = functionPath.node.id ? functionPath.node.id.name : 'anonymous';
         if (name !== 'App') {
            console.log(`Hook ${path.node.callee.name} at line ${path.node.loc.start.line} is in function ${name}`);
         }
      }
    }
  }
});
