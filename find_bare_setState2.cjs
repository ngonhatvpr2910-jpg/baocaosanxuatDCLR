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
    if (path.node.callee.name && path.node.callee.name.startsWith('set')) {
      let parentFunc = path.getFunctionParent();
      if (parentFunc && parentFunc.node.id && parentFunc.node.id.name === 'App') {
        console.log(`Bare setState ${path.node.callee.name} at line ${path.node.loc.start.line}`);
      }
    }
  }
});
