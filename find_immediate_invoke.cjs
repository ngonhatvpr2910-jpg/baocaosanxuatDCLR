const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const content = fs.readFileSync('App.tsx', 'utf8');
const ast = parser.parse(content, {
  sourceType: 'module',
  plugins: ['typescript', 'jsx']
});

traverse(ast, {
  JSXAttribute(path) {
    if (path.node.name.name && path.node.name.name.startsWith('on')) {
      const expr = path.node.value.expression;
      if (expr && expr.type === 'CallExpression') {
         console.log(`Immediate invoke in JSX at line ${path.node.loc.start.line}: ${path.node.name.name}`);
      }
    }
  }
});
