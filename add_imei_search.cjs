const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

if (!content.includes('const [imeiSearchTerm, setImeiSearchTerm] = useState("");')) {
  content = content.replace(
    /(\[scannedImeis\]\);\n)/,
    '$1\n  const [imeiSearchTerm, setImeiSearchTerm] = useState("");\n'
  );
}

// Update the list of scannedImeis to be filtered
if (!content.includes('const filteredScannedImeis = scannedImeis.filter(item =>')) {
  content = content.replace(
    /(\n\s*)(const handleScanSubmit = \(code: string\) => {)/,
    '$1const filteredScannedImeis = scannedImeis.filter(item => {\n    if (!imeiSearchTerm) return true;\n    const searchLower = imeiSearchTerm.toLowerCase();\n    const prod = products.find(p => p.id === item.productId);\n    return item.imei.toLowerCase().includes(searchLower) ||\n           (prod && prod.code.toLowerCase().includes(searchLower)) ||\n           (prod && prod.name.toLowerCase().includes(searchLower));\n  });$1$2'
  );
}

// Add the search input in the UI
if (!content.includes('value={imeiSearchTerm}')) {
  content = content.replace(
    /(<div className="flex items-center gap-2">\s*)<button\s*onClick=\{\(\) => \{\s*if \(window\.confirm\("Bạn có chắc chắn muốn xóa toàn bộ lịch sử IMEI\?"\)\) \{\s*setScannedImeis\(\[\]\);\s*\}\s*\}\}/,
    `$1<input
                      type="text"
                      placeholder="Tìm kiếm IMEI, Model..."
                      value={imeiSearchTerm}
                      onChange={(e) => setImeiSearchTerm(e.target.value)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button 
                       onClick={() => {
                          if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử IMEI?")) {
                             setScannedImeis([]);
                          }
                       }}`
  );
}

// Replace scannedImeis.map with filteredScannedImeis.map
content = content.replace(
  /scannedImeis\.length > 0 \? \(\s*scannedImeis\.map\(\(item\) => \{/,
  'filteredScannedImeis.length > 0 ? (\n                      filteredScannedImeis.map((item) => {'
);

fs.writeFileSync('App.tsx', content);
