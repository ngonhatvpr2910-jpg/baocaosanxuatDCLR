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
      let depNames = [];
      if (deps && deps.type === 'ArrayExpression') {
        depNames = deps.elements.map(e => e.name || e.type);
      }
      
      let setCalls = [];
      path.traverse({
        CallExpression(childPath) {
          if (childPath.node.callee.name && childPath.node.callee.name.startsWith('set')) {
            setCalls.push(childPath.node.callee.name);
          }
        }
      });
      
      if (depNames.includes('formModelItems') || depNames.includes('formDate') || depNames.includes('productionLogs')) {
          console.log(`useEffect at line ${path.node.loc.start.line}:`);
          console.log(`  Deps: [${depNames.join(', ')}]`);
          console.log(`  Sets: [${[...new Set(setCalls)].join(', ')}]`);
      }
    }
  }
});
