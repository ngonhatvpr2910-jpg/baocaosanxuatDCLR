const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const content = fs.readFileSync('App.tsx', 'utf8');
const ast = parser.parse(content, {
  sourceType: 'module',
  plugins: ['typescript', 'jsx']
});

traverse(ast, {
  FunctionDeclaration(path) {
    if (path.node.id && path.node.id.name !== 'App') {
       let hasJSX = false;
       path.traverse({
         JSXElement() { hasJSX = true; }
       });
       if (hasJSX) {
         console.log(`Function ${path.node.id.name} returns JSX. Checking for bare setCalls...`);
       }
    }
  },
  VariableDeclarator(path) {
     if (path.node.init && (path.node.init.type === 'ArrowFunctionExpression' || path.node.init.type === 'FunctionExpression')) {
        let hasJSX = false;
        path.traverse({
           JSXElement() { hasJSX = true; }
        });
        if (hasJSX) {
           console.log(`Variable ${path.node.id.name} is a function returning JSX.`);
        }
     }
  }
});
