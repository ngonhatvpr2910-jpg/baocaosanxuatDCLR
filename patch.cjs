const fs = require('fs');
let code = fs.readFileSync('main.tsx', 'utf8');
const patch = `
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Received NaN')) {
    console.trace('React Received NaN for children');
  }
  originalConsoleError(...args);
};
`;
code = patch + code;
fs.writeFileSync('main.tsx', code);
