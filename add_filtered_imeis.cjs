const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

const filterCode = `  const filteredScannedImeis = useMemo(() => {
    if (!imeiSearchTerm) return scannedImeis;
    const searchLower = imeiSearchTerm.toLowerCase();
    return scannedImeis.filter(item => {
      const prod = products.find(p => p.id === item.productId);
      return item.imei.toLowerCase().includes(searchLower) ||
             (prod && prod.code.toLowerCase().includes(searchLower)) ||
             (prod && prod.name.toLowerCase().includes(searchLower));
    });
  }, [scannedImeis, imeiSearchTerm, products]);
`;

if (!content.includes('const filteredScannedImeis = useMemo')) {
  content = content.replace(
    /const \[imeiSearchTerm, setImeiSearchTerm\] = useState\(""\);\n/,
    'const [imeiSearchTerm, setImeiSearchTerm] = useState("");\n\n' + filterCode + '\n'
  );
}

fs.writeFileSync('App.tsx', content);
