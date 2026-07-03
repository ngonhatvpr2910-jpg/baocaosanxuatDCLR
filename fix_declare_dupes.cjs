const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

// Fix single scan declare
const singleScan = `                            const newDecl = { imei: val, productId, date };
                            let isDuplicate = false;
                            setDeclaredImeis(prev => {
                              const exists = prev.some(p => p.imei === val);
                              if (exists) {
                                isDuplicate = true;
                                return prev;
                              }
                              return [newDecl, ...prev];
                            });
                            
                            if (isDuplicate) {
                              alert(\`❌ IMEI \${val} đã được khai báo trước đó! Không thể khai báo lại.\`);
                              e.currentTarget.value = '';
                              return;
                            }`;

content = content.replace(
  /const newDecl = \{ imei: val, productId, date \};\s*setDeclaredImeis\(prev => \{\s*const exists = prev\.some\(p => p\.imei === val && p\.productId === productId && p\.date === date\);\s*if \(exists\) return prev;\s*return \[newDecl, \.\.\.prev\];\s*\}\);/,
  singleScan
);

// Fix bulk declare
const bulkDeclare = `                    const uniqueImeis = Array.from(new Set(imeis)); // Filter out dupes within the input text itself
                    const validNewDecls: any[] = [];
                    const duplicateImeis: string[] = [];
                    
                    setDeclaredImeis(prev => {
                      // We don't overwrite everything, we append new unique ones
                      uniqueImeis.forEach(i => {
                        const exists = prev.some(p => p.imei === i);
                        if (exists) {
                          duplicateImeis.push(i);
                        } else {
                          validNewDecls.push({ imei: i, productId, date });
                        }
                      });
                      
                      return [...validNewDecls, ...prev];
                    });
                    
                    if (duplicateImeis.length > 0) {
                      alert(\`Đã lưu \${validNewDecls.length} IMEI mới.\\n❌ Đã bỏ qua \${duplicateImeis.length} IMEI do trùng lặp (vd: \${duplicateImeis.slice(0,3).join(', ')}\${duplicateImeis.length > 3 ? '...' : ''})\`);
                    } else {
                      alert(\`✅ Đã khai báo thành công \${validNewDecls.length} IMEI cho KHSX ngày \${date}\`);
                    }
                    (document.getElementById('declareImeiList') as HTMLTextAreaElement).value = '';`;

content = content.replace(
  /const newDecls = imeis\.map\(i => \(\{\s*imei: i,\s*productId,\s*date\s*\}\)\);\s*setDeclaredImeis\(prev => \{\s*const filtered = prev\.filter\(p => !\(p\.productId === productId && p\.date === date\)\);\s*return \[\.\.\.newDecls, \.\.\.filtered\];\s*\}\);\s*alert\(`Đã khai báo thành công \$\{newDecls\.length\} IMEI cho KHSX ngày \$\{date\}`\);\s*\(document\.getElementById\('declareImeiList'\) as HTMLTextAreaElement\)\.value = '';/,
  bulkDeclare
);

fs.writeFileSync('App.tsx', content);
