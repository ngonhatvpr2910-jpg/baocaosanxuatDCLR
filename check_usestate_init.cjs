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
    if (path.node.callee.name === 'useState') {
      const args = path.node.arguments;
      if (args.length > 0 && (args[0].type === 'ArrowFunctionExpression' || args[0].type === 'FunctionExpression')) {
        path.traverse({
          CallExpression(childPath) {
            if (childPath.node.callee.name && childPath.node.callee.name.startsWith('set')) {
              console.log(`Found setState ${childPath.node.callee.name} inside useState initializer at line ${childPath.node.loc.start.line}`);
            }
          }
        });
      }
    }
  }
});
