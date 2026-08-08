const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('App.tsx', 'utf8');
const ast = babel.parse(code, {
  filename: 'App.tsx',
  presets: ['@babel/preset-typescript', '@babel/preset-react']
});

let found = [];

babel.traverse(ast, {
  JSXExpressionContainer(path) {
    if (path.parent.type === 'JSXElement' || path.parent.type === 'JSXFragment') {
      const exp = path.node.expression;
      if (exp.type === 'Identifier') {
        found.push({ line: exp.loc.start.line, code: exp.name });
      } else if (exp.type === 'MemberExpression') {
        found.push({ line: exp.loc.start.line, code: code.substring(exp.start, exp.end) });
      } else if (exp.type === 'LogicalExpression' && exp.operator === '||') {
        // usually || 0, which is safe
      } else if (exp.type === 'ConditionalExpression') {
        // might be safe
      } else if (exp.type === 'BinaryExpression') {
        found.push({ line: exp.loc.start.line, code: code.substring(exp.start, exp.end) });
      } else if (exp.type === 'CallExpression') {
         // might be .toFixed or .toLocaleString or Math.max
         const callStr = code.substring(exp.start, exp.end);
         if (!callStr.includes('.toFixed') && !callStr.includes('.toLocaleString') && !callStr.includes('.toString')) {
           found.push({ line: exp.loc.start.line, code: callStr });
         }
      }
    }
  }
});

found.forEach(f => console.log(`${f.line}: {${f.code}}`));
