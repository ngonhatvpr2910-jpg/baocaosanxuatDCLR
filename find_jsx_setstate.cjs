const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const content = fs.readFileSync('App.tsx', 'utf8');
const ast = parser.parse(content, {
  sourceType: 'module',
  plugins: ['typescript', 'jsx']
});

traverse(ast, {
  JSXExpressionContainer(path) {
    path.traverse({
      CallExpression(childPath) {
        if (childPath.node.callee.name && childPath.node.callee.name.startsWith('set')) {
          // If it's directly inside a JSXExpressionContainer without a function wrapper
          let p = childPath;
          let wrapped = false;
          while (p && p !== path) {
            if (p.isArrowFunctionExpression() || p.isFunctionExpression()) {
               wrapped = true;
               break;
            }
            p = p.parentPath;
          }
          if (!wrapped) {
             console.log(`Unwrapped setState in JSX at line ${childPath.node.loc.start.line}: ${childPath.node.callee.name}`);
          }
        }
      }
    });
  }
});
