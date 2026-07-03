const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

const scanLogic = `                    <input
                      type="text"
                      placeholder="Quét IMEI vào đây (Tự động lưu)..."
                      className="px-3 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            const date = (document.getElementById('declareImeiDate') as HTMLInputElement).value;
                            const productId = (document.getElementById('declareImeiProduct') as HTMLSelectElement).value;
                            if (!date || !productId) {
                              alert('Vui lòng chọn ngày và sản phẩm trước khi quét!');
                              return;
                            }
                            
                            const newDecl = { imei: val, productId, date };
                            setDeclaredImeis(prev => {
                              const exists = prev.some(p => p.imei === val && p.productId === productId && p.date === date);
                              if (exists) return prev;
                              return [newDecl, ...prev];
                            });
                            
                            const ta = document.getElementById('declareImeiList') as HTMLTextAreaElement;
                            ta.value = ta.value ? ta.value + '\\n' + val : val;
                            e.currentTarget.value = '';
                            
                            // Highlight the scan was successful
                            const scanInput = e.currentTarget;
                            scanInput.classList.add('bg-emerald-900/50');
                            setTimeout(() => {
                                scanInput.classList.remove('bg-emerald-900/50');
                            }, 300);
                          }
                        }
                      }}
                    />`;

content = content.replace(
  /<input\s*type="text"\s*placeholder="Quét IMEI vào đây\.\.\."[\s\S]*?\}\}\s*\/>/,
  scanLogic
);

fs.writeFileSync('App.tsx', content);
