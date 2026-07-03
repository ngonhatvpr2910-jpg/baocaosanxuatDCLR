const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

// Replace state init
content = content.replace(
  /const \[scannedImeis, setScannedImeis\] = useState<ScannedImei\[\]>\(\(\) => \{\s*const saved = localStorage\.getItem\("sunhouse_scanned_imeis"\);\s*if \(saved\) \{\s*try \{ return JSON\.parse\(saved\); \} catch\(e\)\{\}\s*\}\s*return \[\];\s*\}\);/,
  `const [scannedImeis, setScannedImeis] = useState<ScannedImei[]>(() => {
    const saved = localStorage.getItem("sunhouse_scanned_imeis");
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          return parsed.filter((item: any) => new Date(item.timestamp).getTime() > thirtyDaysAgo);
        }
      } catch(e){}
    }
    return [];
  });`
);

// Remove the button
content = content.replace(
  /<button\s*onClick=\{\(\) => \{\s*if \(window\.confirm\("Bạn có chắc chắn muốn xóa toàn bộ lịch sử IMEI\?"\)\) \{\s*setScannedImeis\(\[\]\);\s*\}\s*\}\}\s*className="px-3 py-1\.5 bg-rose-500\/10 text-rose-500 hover:bg-rose-500\/20 text-xs font-semibold rounded transition"\s*>\s*Xóa tất cả\s*<\/button>/,
  ''
);

fs.writeFileSync('App.tsx', content);
