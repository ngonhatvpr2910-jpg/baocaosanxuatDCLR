const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

const scanCheckLogic = `
    const targetModelId = scanModelId || (formModelItems && formModelItems.length > 0 ? formModelItems[0].productId : null);
    if (!targetModelId) {
      setFormMessage("❌ Vui lòng thêm ít nhất 1 mã hàng vào form trước khi quét.");
      setScanInput("");
      return;
    }

    // --- CHECK KHSX ---
    const dateParts = formDate.split("-");
    const checkYearMonth = \`\${dateParts[0]}-\${dateParts[1]}\`;
    const checkDay = parseInt(dateParts[2], 10);
    const planForToday = monthlyPlan[checkYearMonth]?.[targetModelId]?.[checkDay] || 0;

    if (planForToday <= 0) {
      setFormMessage(\`❌ Mã hàng chưa có Kế Hoạch Sản Xuất (\${formDate}). Không thể quét.\`);
      setScanInput("");
      return;
    }

    // Count already scanned today for this targetModelId
    const scannedTodayCount = scannedImeis.filter(item => {
      if (item.productId !== targetModelId) return false;
      try {
        const itemDateStr = new Date(item.timestamp).toISOString().slice(0, 10);
        return itemDateStr === formDate; // Compare with formDate
      } catch(e) {
        return false;
      }
    }).length;

    if (scannedTodayCount >= planForToday) {
      setFormMessage(\`❌ Đã đủ KHSX hôm nay (\${scannedTodayCount}/\${planForToday}). Không thể quét thêm.\`);
      setScanInput("");
      return;
    }
    // ------------------
`;

content = content.replace(
  /const targetModelId = scanModelId \|\| \(formModelItems && formModelItems\.length > 0 \? formModelItems\[0\]\.productId : null\);\n\s*if \(!targetModelId\) \{\n\s*setFormMessage\("❌ Vui lòng thêm ít nhất 1 mã hàng vào form trước khi quét\."\);\n\s*setScanInput\(""\);\n\s*return;\n\s*\}/,
  scanCheckLogic
);

fs.writeFileSync('App.tsx', content);
