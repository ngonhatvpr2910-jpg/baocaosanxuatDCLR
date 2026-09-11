import React from 'react';
import {
  RefreshCw, Download, Upload, CheckCircle, Info, FileSpreadsheet, FileCode, Layers, Users, Package, Calendar, Database, ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';

export const SystemDataTab = ({
  handleExportFullBackup,
  handleExportJsonBackup,
  handleImportFullBackup,
  restoreMode,
  setRestoreMode,
  syncEntireSystem,
  syncStatus,
  syncMessage,
  isSupabaseConfigured,
  refreshFromCloud,
  productionLogs = [],
  products = [],
  workers = [],
  attendanceLogs = [],
  declaredImeis = [],
  scannedImeis = []
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
        {/* Header */}
        <div className="p-8 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <RefreshCw className="w-7 h-7 text-amber-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Quản Lý, Sao Lưu & Khôi Phục Dữ Liệu</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Khôi phục dữ liệu cũ từ file Backup (Excel / JSON), đồng bộ toàn hệ thống và lưu trữ an toàn.
                </p>
              </div>
            </div>

            {syncEntireSystem && (
              <button
                onClick={syncEntireSystem}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-950/40 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                Đồng bộ toàn hệ thống
              </button>
            )}
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Live Database Statistics */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              Trạng thái cơ sở dữ liệu hiện tại
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 flex flex-col">
                <span className="text-xs text-slate-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-sky-400" /> Nhật ký ca</span>
                <span className="text-xl font-black text-white mt-1">{productionLogs.length} <span className="text-xs font-normal text-slate-500">bản ghi</span></span>
              </div>
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 flex flex-col">
                <span className="text-xs text-slate-400 flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-emerald-400" /> Sản phẩm</span>
                <span className="text-xl font-black text-white mt-1">{products.length} <span className="text-xs font-normal text-slate-500">mã SP</span></span>
              </div>
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 flex flex-col">
                <span className="text-xs text-slate-400 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-amber-400" /> Nhân sự</span>
                <span className="text-xl font-black text-white mt-1">{workers.length} <span className="text-xs font-normal text-slate-500">công nhân</span></span>
              </div>
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 flex flex-col">
                <span className="text-xs text-slate-400 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-teal-400" /> Điểm danh</span>
                <span className="text-xl font-black text-white mt-1">{attendanceLogs.length} <span className="text-xs font-normal text-slate-500">lượt</span></span>
              </div>
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 flex flex-col">
                <span className="text-xs text-slate-400 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-indigo-400" /> IMEI Khai báo</span>
                <span className="text-xl font-black text-white mt-1">{declaredImeis.length} <span className="text-xs font-normal text-slate-500">mã</span></span>
              </div>
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 flex flex-col">
                <span className="text-xs text-slate-400 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Lưu trữ Cloud</span>
                <span className="text-sm font-bold text-emerald-400 mt-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isSupabaseConfigured ? 'Supabase Ready' : 'Local Storage'}
                </span>
              </div>
            </div>
          </div>

          {/* Restore Mode Selection */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6">
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  Chế độ khôi phục dữ liệu khi nạp file
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lựa chọn cách thức xử lý dữ liệu khi bạn tải lên file backup cũ:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label 
                  onClick={() => setRestoreMode?.('overwrite')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    restoreMode === 'overwrite' 
                      ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30' 
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="restoreMode"
                    value="overwrite"
                    checked={restoreMode === 'overwrite'}
                    onChange={() => setRestoreMode?.('overwrite')}
                    className="mt-1 text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      Ghi đè hoàn toàn (Thay thế toàn bộ)
                      {restoreMode === 'overwrite' && <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full">Đang chọn</span>}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Toàn bộ dữ liệu hiện tại trên ứng dụng sẽ được thay thế chuẩn xác 100% theo dữ liệu trong file backup.
                    </div>
                  </div>
                </label>

                <label 
                  onClick={() => setRestoreMode?.('merge')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    restoreMode === 'merge' 
                      ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30' 
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="restoreMode"
                    value="merge"
                    checked={restoreMode === 'merge'}
                    onChange={() => setRestoreMode?.('merge')}
                    className="mt-1 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      Hợp nhất thông minh (Giữ lại & Ghép dữ liệu cũ)
                      {restoreMode === 'merge' && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full">Đang chọn</span>}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Giữ nguyên các bản ghi mới hiện tại, đồng thời nạp bổ sung các bản ghi cũ từ file backup (ghép theo ID / Mã ca).
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Import / Restore Section */}
          <div className="bg-slate-950/40 border border-emerald-500/20 rounded-2xl p-6 hover:border-emerald-500/40 transition-colors group">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  Nạp File Backup Để Khôi Phục Dữ Liệu
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                  Hỗ trợ cả file <strong className="text-emerald-400">Excel (.xlsx, .xls)</strong> và file <strong className="text-sky-400">JSON (.json)</strong> sao lưu trước đó. 
                  Hệ thống tự động nhận diện thông minh tất cả bảng dữ liệu (Nhật ký ca, Sản phẩm, Nhân sự, Điểm danh, Kế hoạch, Chỉ số KPI...) và tính toán đồng bộ lại toàn bộ biểu đồ.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
                  <span className="bg-slate-800/80 px-2.5 py-1 rounded-md text-slate-300 font-mono">.xlsx</span>
                  <span className="bg-slate-800/80 px-2.5 py-1 rounded-md text-slate-300 font-mono">.xls</span>
                  <span className="bg-slate-800/80 px-2.5 py-1 rounded-md text-slate-300 font-mono">.json</span>
                  <span className="text-emerald-400 font-medium">✓ Tự động tính toán lại KPI & NSLĐ sau khi nạp</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0 self-start sm:self-auto">
                <label className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer group-hover:scale-105">
                  <Upload className="w-5 h-5" />
                  Chọn File Khôi Phục
                  <input
                    type="file"
                    accept=".xlsx, .xls, .json"
                    className="hidden"
                    onChange={handleImportFullBackup}
                  />
                </label>
                <span className="text-[11px] text-center text-slate-500">Chế độ: {restoreMode === 'overwrite' ? 'Ghi đè hoàn toàn' : 'Hợp nhất dữ liệu'}</span>
              </div>
            </div>
          </div>

          {/* Export / Backup Section */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors group">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-sky-400" />
                  Xuất File Sao Lưu Hệ Thống (Backup)
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                  Lưu trữ toàn bộ cơ sở dữ liệu hệ thống ra file ngoại tuyến để cất giữ an toàn hoặc di chuyển sang thiết bị khác bất cứ lúc nào.
                </p>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0 self-start sm:self-auto">
                <button
                  onClick={handleExportFullBackup}
                  className="px-5 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-sky-900/20 flex items-center gap-2 cursor-pointer hover:scale-105"
                  title="Xuất file Excel gồm 11 sheet đầy đủ"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  Xuất Excel (11 Sheet)
                </button>
                {handleExportJsonBackup && (
                  <button
                    onClick={handleExportJsonBackup}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/20 flex items-center gap-2 cursor-pointer hover:scale-105"
                    title="Xuất file JSON nguyên bản"
                  >
                    <FileCode className="w-5 h-5" />
                    Xuất JSON
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-200/70 leading-relaxed space-y-1">
                <span className="font-bold text-amber-400 block mb-1 uppercase tracking-wider text-[10px]">Lưu ý quan trọng khi khôi phục dữ liệu:</span>
                <div>• Hệ thống hỗ trợ đọc lại cả các file sao lưu Excel phiên bản cũ và mới nhờ cơ chế tự động ánh xạ thông minh các Sheet.</div>
                <div>• Sau khi khôi phục thành công, toàn bộ dữ liệu sẽ được lưu tự động vào bộ nhớ trình duyệt và đồng bộ lên Supabase Cloud (nếu đã kết nối).</div>
                <div>• Khuyên dùng: Hãy tải xuống một file Backup dự phòng định kỳ hàng tuần hoặc trước khi thực hiện các thay đổi lớn.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

