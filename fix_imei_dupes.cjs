const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

// 1. Add scan check
const scanCheck = `    // --- CHECK DECLARED IMEI ---
    const isDeclared = declaredImeis.some(d => d.imei === val && d.productId === targetModelId && d.date === formDate);
    if (!isDeclared) {
      setFormMessage(\`❌ IMEI \${val} chưa được khai báo cho KHSX ngày \${formDate}.\`);
      setScanInput("");
      return;
    }
    
    // --- CHECK DUPLICATE SCANNED IMEI ---
    const isAlreadyScanned = scannedImeis.some(s => s.imei === val);
    if (isAlreadyScanned) {
      setFormMessage(\`❌ IMEI \${val} đã được quét thành công trước đó (trùng lặp).\`);
      setScanInput("");
      return;
    }
    // ------------------`;

content = content.replace(
  /\/\/ --- CHECK DECLARED IMEI ---\s*const isDeclared = declaredImeis\.some\(d => d\.imei === val && d\.productId === targetModelId && d\.date === formDate\);\s*if \(!isDeclared\) \{\s*setFormMessage\(`❌ IMEI \$\{val\} chưa được khai báo cho KHSX ngày \$\{formDate\}\.`\);\s*setScanInput\(""\);\s*return;\s*\}\s*\/\/ ------------------/,
  scanCheck
);

fs.writeFileSync('App.tsx', content);
