import { YAXIS_DOMAIN, getProductModelCode, getWeeksInMonth, getYearWeeks, getStandardYearWeeks } from "./appUtils";
import * as XLSX from "xlsx";
import { SUNHOUSE_LINES, INDUSTRIAL_STANDARDS } from "./data";
import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, ReferenceLine, LabelList
} from 'recharts';
import {
  TrendingUp, Users, Award, Calendar, Layers, ChevronRight, Database, PlusCircle, Clock, Sparkles, Info, CheckCircle, RotateCcw, Sliders, Flame, Droplet, FileText, FileCheck, Building, ArrowRight, Calculator, FileSpreadsheet, Trash2, Edit, Pencil, X, Upload, Download, Check, AlertCircle, Zap, DollarSign, Activity, Lock, Unlock, History, ScanBarcode, Barcode, List, Search, Filter, Eye, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// Types might be needed, let's just use any for now or import from types
import { ProductGroup, MonthlyMetric } from './types';

export const SystemDataTab = ({
  handleExportFullBackup,
  handleImportFullBackup
}: any) => {
  return (
    <motion.div
              key="system-data"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
                <div className="p-8 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <RefreshCw className="w-7 h-7 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white tracking-tight">Quản Lý Dữ Liệu Hệ Thống</h2>
                      <p className="text-slate-400 text-sm mt-1">
                        Sao lưu và khôi phục toàn bộ cơ sở dữ liệu báo cáo qua file Excel.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {/* Export Section */}
                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors group">
                    <div className="flex items-start justify-between gap-6">
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Download className="w-5 h-5 text-sky-400" />
                          Xuất Toàn Bộ Dữ Liệu (Backup)
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                          Hệ thống sẽ tổng hợp tất cả Nhật ký sản xuất, Danh mục sản phẩm, Kế hoạch tháng, 
                          và các Chỉ số KPI vào một file Excel duy nhất có nhiều sheet. 
                          Dùng để lưu trữ offline hoặc di chuyển dữ liệu.
                        </p>
                      </div>
                      <button
                        onClick={handleExportFullBackup}
                        className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-sky-900/20 flex items-center gap-2 shrink-0 group-hover:scale-105 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-5 h-5" />
                        Xuất Excel
                      </button>
                    </div>
                  </div>

                  {/* Import Section */}
                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors group">
                    <div className="flex items-start justify-between gap-6">
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Upload className="w-5 h-5 text-emerald-400" />
                          Khôi Phục Dữ Liệu (Restore)
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                          Tải lên file Excel backup đã xuất trước đó để khôi phục toàn bộ trạng thái hệ thống. 
                          <span className="text-amber-400 font-semibold block mt-1">⚠️ Cảnh báo: Dữ liệu hiện tại trên trình duyệt sẽ bị ghi đè hoàn toàn.</span>
                        </p>
                      </div>
                      <label className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 shrink-0 cursor-pointer group-hover:scale-105">
                        <RefreshCw className="w-5 h-5" />
                        Chọn File Backup
                        <input
                          type="file"
                          accept=".xlsx, .xls"
                          className="hidden"
                          onChange={handleImportFullBackup}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-amber-200/70 leading-relaxed">
                        <span className="font-bold text-amber-400 block mb-1 uppercase tracking-wider text-[10px]">Hướng dẫn quan trọng:</span>
                        - File Excel backup chứa nhiều Sheet (Production_Logs, Products, Monthly_Plan, ...). Không nên thay đổi tên Sheet nếu muốn khôi phục chính xác.<br/>
                        - Bạn có thể chỉnh sửa dữ liệu trực tiếp trong file Excel rồi khôi phục lại, nhưng hãy đảm bảo định dạng cột không thay đổi.<br/>
                        - Dữ liệu được lưu trữ cục bộ trong trình duyệt (LocalStorage). Việc "Dọn dẹp trình duyệt" có thể làm mất dữ liệu, vì vậy hãy sao lưu thường xuyên.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
  );
};
