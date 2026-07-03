const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

const debugPatch = `
let renderCount = 0;
let lastRenderTime = 0;
const useDebugRender = (componentName) => {
  const now = Date.now();
  if (now - lastRenderTime > 1000) {
    renderCount = 0;
  }
  lastRenderTime = now;
  renderCount++;
  if (renderCount > 20) {
     console.error('MAX UPDATE DEPTH DETECTED in', componentName, 'render count:', renderCount);
     console.trace();
  }
};
`;

if (!content.includes('useDebugRender')) {
   content = content.replace('export default function App() {', debugPatch + '\nexport default function App() {\n  useDebugRender("App");');
   fs.writeFileSync('App.tsx', content);
}
