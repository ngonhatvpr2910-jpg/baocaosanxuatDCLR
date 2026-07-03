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
      let isUnsafe = false;
      let p = path.parentPath;
      while (p) {
        if (p.isJSXExpressionContainer() || p.isArrowFunctionExpression() || p.isFunctionExpression()) {
           if (p.isJSXExpressionContainer()) {
              // usually ok if it's an event handler, but if it's not?
           } else {
              // it's in a function. Is this function an event handler or a render function?
              // we can't tell easily.
           }
        }
        if (p.isCallExpression() && p.node.callee.name === 'useEffect') {
           return; // Safe, it's inside useEffect
        }
        p = p.parentPath;
      }
      
      // Let's just print all setCalls that are not inside useEffect or useCallback or event handlers
    }
  }
});
