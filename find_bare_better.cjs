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
      let p = path.parentPath;
      let isSafe = false;
      while (p) {
        if (
          (p.isCallExpression() && p.node.callee.name === 'useEffect') ||
          (p.isCallExpression() && p.node.callee.name === 'useCallback') ||
          (p.isJSXAttribute() && p.node.name.name.startsWith('on')) ||
          (p.isJSXExpressionContainer() && p.parentPath.isJSXAttribute() && p.parentPath.node.name.name.startsWith('on'))
        ) {
          isSafe = true;
          break;
        }
        if (p.isArrowFunctionExpression() || p.isFunctionExpression()) {
           // We can't automatically say it's safe just because it's in a function. 
           // But let's log it if it's NOT in useEffect/useCallback/on*
        }
        p = p.parentPath;
      }
      
      if (!isSafe) {
         // let's check if the function it is in, is used as an event handler
         let functionPath = path.getFunctionParent();
         if (functionPath && functionPath.node.id && functionPath.node.id.name === 'App') {
            console.log(`Directly in App: ${path.node.callee.name} at line ${path.node.loc.start.line}`);
         } else if (functionPath) {
            let name = functionPath.node.id ? functionPath.node.id.name : 'anonymous';
            if (functionPath.parentPath && functionPath.parentPath.isVariableDeclarator()) {
               name = functionPath.parentPath.node.id.name;
            }
            if (!name.startsWith('handle') && name !== 'anonymous') {
               console.log(`In function ${name}: ${path.node.callee.name} at line ${path.node.loc.start.line}`);
            }
         }
      }
    }
  }
});
