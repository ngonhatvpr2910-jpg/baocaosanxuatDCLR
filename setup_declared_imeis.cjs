const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

// 1. Add interface if needed, or just state
content = content.replace(
  /const \[scannedImeis, setScannedImeis\] = useState<ScannedImei\[\]>/,
  `interface DeclaredImei { imei: string; productId: string; date: string; }
  const [declaredImeis, setDeclaredImeis] = useState<DeclaredImei[]>(() => {
    const saved = localStorage.getItem("sunhouse_declared_imeis");
    if (saved) {
      try { return JSON.parse(saved); } catch(e){}
    }
    return [];
  });
  useEffect(() => {
    localStorage.setItem("sunhouse_declared_imeis", JSON.stringify(declaredImeis));
  }, [declaredImeis]);

  const [scannedImeis, setScannedImeis] = useState<ScannedImei[]>`
);

// 2. Add validation in handleScanSubmit
content = content.replace(
  /\/\/ ------------------\n/,
  `// --- CHECK DECLARED IMEI ---
    const isDeclared = declaredImeis.some(d => d.imei === val && d.productId === targetModelId && d.date === formDate);
    if (!isDeclared) {
      setFormMessage(\`❌ IMEI \${val} chưa được khai báo cho KHSX ngày \${formDate}.\`);
      setScanInput("");
      return;
    }
    // ------------------\n`
);

fs.writeFileSync('App.tsx', content);
