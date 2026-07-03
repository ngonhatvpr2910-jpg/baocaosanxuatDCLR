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
       console.log(`useEffect at line ${path.node.loc.start.line}`);
       path.traverse({
          CallExpression(childPath) {
             if (childPath.node.callee.name && childPath.node.callee.name.startsWith('set')) {
                console.log(`  calls: ${childPath.node.callee.name}`);
             }
          }
       });
    }
  }
});
