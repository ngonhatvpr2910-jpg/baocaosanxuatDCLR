const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

const filterLogic = `  const [imeiFilterDate, setImeiFilterDate] = useState(new Date().toISOString().slice(0, 10));

  const filteredScannedImeis = useMemo(() => {
    let filtered = scannedImeis;
    if (imeiFilterDate) {
      filtered = filtered.filter(item => {
        try {
          return new Date(item.timestamp).toISOString().slice(0, 10) === imeiFilterDate;
        } catch (e) {
          return false;
        }
      });
    }
    if (imeiSearchTerm) {
      const searchLower = imeiSearchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const prod = products.find(p => p.id === item.productId);
        return item.imei.toLowerCase().includes(searchLower) ||
               (prod && prod.code.toLowerCase().includes(searchLower)) ||
               (prod && prod.name.toLowerCase().includes(searchLower));
      });
    }
    return filtered;
  }, [scannedImeis, imeiSearchTerm, imeiFilterDate, products]);`;

content = content.replace(
  /const \[imeiSearchTerm, setImeiSearchTerm\] = useState\(""\);\s*const filteredScannedImeis = useMemo\(\(\) => \{[\s\S]*?\}, \[scannedImeis, imeiSearchTerm, products\]\);/,
  'const [imeiSearchTerm, setImeiSearchTerm] = useState("");\n' + filterLogic
);

const filterUI = `<input
                      type="date"
                      value={imeiFilterDate}
                      onChange={(e) => setImeiFilterDate(e.target.value)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <input
                      type="text"`;

content = content.replace(
  /<input\s*type="text"\s*placeholder="Tìm kiếm IMEI, Model\.\.\."\s*value=\{imeiSearchTerm\}/,
  filterUI + '\n                      placeholder="Tìm kiếm IMEI, Model..."\n                      value={imeiSearchTerm}'
);

fs.writeFileSync('App.tsx', content);
