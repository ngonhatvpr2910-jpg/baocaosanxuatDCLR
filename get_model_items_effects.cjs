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
    if (path.node.callee.name === 'useEffect') {
      const deps = path.node.arguments[1];
      if (deps && deps.type === 'ArrayExpression') {
         const depNames = deps.elements.map(e => e.name || e.type);
         if (depNames.includes('formModelItems')) {
            console.log(`useEffect with formModelItems at line ${path.node.loc.start.line}`);
         }
      }
    }
  }
});
