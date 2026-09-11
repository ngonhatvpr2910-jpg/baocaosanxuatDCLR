import React, { useState, useEffect, useRef } from 'react';
import { Worker, AttendanceRecord, WorkerDivision, WorkerType } from './types';
import { INITIAL_WORKERS } from './data';
import { Plus, Trash2, Edit2, QrCode, User, ScanLine, X, CheckCircle, FileText, Download, RefreshCw, Upload, AlertCircle, Camera, AlertTriangle, Users, Flame, Layers, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import * as storage from './storage';

interface PersonnelTabProps {
  workers: Worker[];
  setWorkers: React.Dispatch<React.SetStateAction<Worker[]>>;
  fetchWorkers?: () => Promise<void>;
  attendanceLogs: AttendanceRecord[];
  setAttendanceLogs: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

export const PersonnelTab: React.FC<PersonnelTabProps> = ({
  workers,
  setWorkers,
  fetchWorkers,
  attendanceLogs,
  setAttendanceLogs
}) => {
  const [activeView, setActiveView] = useState<'LIST' | 'SCAN' | 'REPORT'>('LIST');

  // FORM STATE
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [formName, setFormName] = useState("");
  const [formDivision, setFormDivision] = useState<WorkerDivision>("RO");
  const [formType, setFormType] = useState<WorkerType>("OFFICIAL");
  const [formCode, setFormCode] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ASYNC & NOTIFICATION STATES
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getWorkerTypeFromId = (id: string): WorkerType => {
    const upper = id.toUpperCase();
    if (upper.includes("THUVIEC")) return "PROBATION";
    if (upper.includes("TV") || upper.includes("THOIVU") || upper.includes("SEASONAL")) return "SEASONAL";
    return "OFFICIAL";
  };

  // 2. SỬA / CẬP NHẬT (UPDATE) & 3. THÊM MỚI (INSERT)
  const handleSave = async () => {
    if (!formName.trim()) {
      showToast("Vui lòng nhập họ và tên nhân viên!", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && editId) {
        // 2. SỬA / CẬP NHẬT (UPDATE):
        const targetId = formCode.trim() || editId;
        const derivedType = formType || getWorkerTypeFromId(targetId);

        const updatedData: Record<string, any> = {
          name: formName.trim(),
          division: formDivision,
          type: derivedType,
          qr_code: targetId,
          updated_at: new Date().toISOString()
        };

        if (targetId !== editId) {
          updatedData.id = targetId;
        }

        if (supabase && isSupabaseConfigured) {
          const { error } = await supabase
            .from('workers')
            .update(updatedData)
            .eq('id', editId);

          if (error) {
            throw new Error(error.message || 'Lỗi khi cập nhật nhân viên trên Supabase');
          }
        }

        // Chỉ cập nhật State trên giao diện sau khi Supabase trả về kết quả thành công
        setWorkers(prev => prev.map(w => w.id === editId ? {
          ...w,
          id: targetId,
          name: formName.trim(),
          division: formDivision,
          type: derivedType,
          qrCode: targetId
        } : w));

        showToast(`Cập nhật nhân viên "${formName.trim()}" thành công!`, "success");
        setIsEditing(false);
        setEditId("");
        setFormName("");
        setFormCode("");
        setFormType("OFFICIAL");
      } else {
        // 3. THÊM MỚI (INSERT):
        const workerId = formCode.trim() || `60000${Math.floor(1000 + Math.random() * 9000)}`;
        const derivedType = formType || getWorkerTypeFromId(workerId);

        const exists = workers.find(w => w.id === workerId);
        if (exists) {
          showToast(`Mã nhân viên "${workerId}" đã tồn tại trên hệ thống!`, "error");
          setIsSubmitting(false);
          return;
        }

        const newData = {
          id: workerId,
          name: formName.trim(),
          division: formDivision,
          type: derivedType,
          qr_code: workerId,
          image_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (supabase && isSupabaseConfigured) {
          const { error } = await supabase
            .from('workers')
            .insert([newData]);

          if (error) {
            throw new Error(error.message || 'Lỗi khi thêm mới nhân viên trên Supabase');
          }
        }

        // Chỉ cập nhật State trên giao diện sau khi Supabase trả về kết quả thành công
        const newWorkerItem: Worker = {
          id: workerId,
          name: formName.trim(),
          division: formDivision,
          type: derivedType,
          qrCode: workerId
        };
        setWorkers(prev => [newWorkerItem, ...prev]);

        showToast(`Đã thêm nhân viên "${formName.trim()}" (${workerId}) thành công!`, "success");
        setIsEditing(false);
        setEditId("");
        setFormName("");
        setFormCode("");
        setFormType("OFFICIAL");
      }
    } catch (err: any) {
      console.error('Lỗi khi lưu nhân viên:', err);
      const msg = err?.message || JSON.stringify(err);
      showToast(`Lưu nhân viên thất bại: ${msg}`, "error");
      alert(`Lưu nhân viên thất bại: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (w: Worker) => {
    setIsEditing(true);
    setEditId(w.id);
    setFormName(w.name);
    setFormDivision(w.division);
    setFormCode(w.qrCode);
    setFormType(w.type || "OFFICIAL");
  };

  // 1. XÓA (DELETE)
  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async (workerId: string) => {
    if (!workerId) return;
    setIsDeleting(true);
    try {
      if (supabase && isSupabaseConfigured) {
        const { error } = await supabase
          .from('workers')
          .delete()
          .eq('id', workerId);

        if (error) {
          throw new Error(error.message || 'Lỗi khi xóa nhân viên trên Supabase');
        }
      }

      // Chỉ cập nhật State trên giao diện sau khi Supabase trả về kết quả xóa thành công
      setWorkers(prev => prev.filter(w => w.id !== workerId));
      setDeleteConfirmId(null);
      showToast(`Đã xóa nhân viên có mã "${workerId}" thành công!`, "success");
    } catch (err: any) {
      console.error('Lỗi khi xóa nhân viên:', err);
      const msg = err?.message || JSON.stringify(err);
      showToast(`Xóa nhân viên thất bại: ${msg}`, "error");
      alert(`Xóa nhân viên thất bại: ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReloadFromCloud = async () => {
    setIsRefreshing(true);
    try {
      if (fetchWorkers) {
        await fetchWorkers();
      } else {
        const fresh = await storage.getWorkers();
        if (fresh) setWorkers(fresh);
      }
      showToast("Đã đồng bộ lại danh sách nhân sự mới nhất từ Supabase Cloud!", "success");
    } catch (err: any) {
      showToast(`Lỗi đồng bộ: ${err?.message || err}`, "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResetData = () => {
    if (confirm("Hành động này sẽ tải lại danh sách gốc từ hệ thống. Bạn có chắc chắn không?")) {
      handleReloadFromCloud();
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      ["Mã NV", "Họ và Tên", "Bộ phận", "Loại nhân sự"],
      ["600001058", "Lê Văn Đà", "RO", "Chính thức"],
      ["600001124", "Nguyễn Ngọc Dàng", "BG", "Chính thức"],
      ["600000567TV", "Lê Ngọc Phước", "BG", "Thời vụ"],
      ["600001087", "Võ Minh Nghĩa", "RMA", "Thử việc"],
      ["600000701TV", "Bùi Minh Quang", "RO", "Thời vụ"],
      ["600001053", "Nguyễn Lý Hữu Tiến", "BG", "Chính thức"]
    ];

    const guideData = [
      ["HƯỚNG DẪN NHẬP DỮ LIỆU DANH SÁCH NHÂN SỰ SUNHOUSE"],
      [""],
      ["Tên cột", "Ý nghĩa", "Quy định & Giá trị hợp lệ"],
      ["Mã NV", "Mã nhân viên / Mã QR điểm danh", "Bắt buộc. Ví dụ: 600001058, 600000567TV. Không được trùng nhau."],
      ["Họ và Tên", "Họ và tên nhân sự", "Bắt buộc. Ví dụ: Nguyễn Văn A, Lê Văn Đà."],
      ["Bộ phận", "Dây chuyền / Bộ phận làm việc", "Chọn 1 trong 3: RO (Lắp ráp), BG (Bếp Gas), hoặc RMA."],
      ["Loại nhân sự", "Phân loại lao động", "Chọn 1 trong 3: Chính thức (OFFICIAL), Thời vụ (SEASONAL/TV), Thử việc (PROBATION)."]
    ];

    const wsData = XLSX.utils.aoa_to_sheet(templateData);
    wsData['!cols'] = [{ wch: 16 }, { wch: 26 }, { wch: 16 }, { wch: 20 }];

    const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
    wsGuide['!cols'] = [{ wch: 18 }, { wch: 36 }, { wch: 60 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsData, "DanhSachNhanSu");
    XLSX.utils.book_append_sheet(wb, wsGuide, "HuongDan_NhapLieu");

    XLSX.writeFile(wb, "FileMau_DanhSachNhanSu_Sunhouse.xlsx");
  };

  const handleExportWorkers = () => {
    if (workers.length === 0) {
      showToast("Chưa có dữ liệu nhân sự để xuất!", "error");
      return;
    }
    const data = [
      ["Mã NV", "Họ và Tên", "Bộ phận", "Loại nhân sự"],
      ...workers.map(w => [
        w.qrCode || w.id,
        w.name,
        w.division,
        w.type === "OFFICIAL" ? "Chính thức" : w.type === "SEASONAL" ? "Thời vụ" : "Thử việc"
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 16 }, { wch: 26 }, { wch: 16 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DanhSachNhanSu");
    XLSX.writeFile(wb, `DanhSachNhanSu_${new Date().toISOString().split("T")[0]}.xlsx`);
    showToast(`Đã xuất ${workers.length} nhân sự ra file Excel thành công!`, "success");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const data = XLSX.utils.sheet_to_json<any[][]>(ws, { header: 1 });
        
        if (data.length <= 1) {
          showToast("File excel trống hoặc không đúng định dạng!", "error");
          return;
        }

        const importedWorkers: Worker[] = [];
        const seenIds = new Set<string>();

        // Bỏ qua dòng đầu tiên (header)
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length < 2 || !row[0]) continue;
          
          const maNV = String(row[0]).trim();
          const tenNV = String(row[1]).trim();
          if (!maNV || !tenNV) continue;
          if (seenIds.has(maNV)) continue;
          seenIds.add(maNV);

          // Cột 3: Bộ phận (RO / BG / RMA)
          const boPhanRaw = row.length >= 3 && row[2] ? String(row[2]).trim().toUpperCase() : "BG";
          let boPhan: WorkerDivision = "BG";
          if (boPhanRaw.includes("RO") || boPhanRaw.includes("LẮP RÁP") || boPhanRaw.includes("LAP RAP") || boPhanRaw.includes("ASSEMBLY")) {
            boPhan = "RO";
          } else if (boPhanRaw.includes("RMA")) {
            boPhan = "RMA";
          } else if (boPhanRaw.includes("BG") || boPhanRaw.includes("GAS") || boPhanRaw.includes("BẾP") || boPhanRaw.includes("BEP")) {
            boPhan = "BG";
          }

          // Cột 4: Loại nhân sự (Chính thức / Thời vụ / Thử việc)
          const loaiLDRaw = row.length >= 4 && row[3] ? String(row[3]).trim().toUpperCase() : "";
          let loaiLD: WorkerType;
          if (loaiLDRaw.includes("THỜI VỤ") || loaiLDRaw.includes("THOI VU") || loaiLDRaw.includes("SEASONAL") || loaiLDRaw === "TV") {
            loaiLD = "SEASONAL";
          } else if (loaiLDRaw.includes("THỬ VIỆC") || loaiLDRaw.includes("THU VIEC") || loaiLDRaw.includes("PROBATION")) {
            loaiLD = "PROBATION";
          } else if (loaiLDRaw.includes("CHÍNH THỨC") || loaiLDRaw.includes("CHINH THUC") || loaiLDRaw.includes("OFFICIAL")) {
            loaiLD = "OFFICIAL";
          } else {
            loaiLD = getWorkerTypeFromId(maNV);
          }
          
          importedWorkers.push({
            id: maNV,
            qrCode: maNV,
            name: tenNV,
            division: boPhan,
            type: loaiLD
          });
        }

        if (importedWorkers.length > 0) {
          setIsSubmitting(true);
          storage.saveAllWorkers(importedWorkers).then(() => {
            setWorkers(importedWorkers);
            showToast(`Đã import và đồng bộ ${importedWorkers.length} nhân sự lên hệ thống thành công!`, "success");
          }).catch((err: any) => {
            setWorkers(importedWorkers);
            showToast(`Import hoàn tất, đang lưu vào bộ nhớ tạm (${err?.message || err})`, "error");
          }).finally(() => {
            setIsSubmitting(false);
          });
        } else {
          showToast("Không tìm thấy dữ liệu hợp lệ trong file Excel. Vui lòng đảm bảo: Cột 1 là Mã NV, Cột 2 là Họ Tên, Cột 3 là Bộ Phận, Cột 4 là Loại LĐ.", "error");
        }
      } catch (err: any) {
        console.error(err);
        showToast(`Lỗi khi đọc file Excel: ${err?.message || err}`, "error");
      }
      
      // Reset input
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="w-full relative">
      {/* Thông báo Toast trực quan */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[200] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium border backdrop-blur-md transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-200 border-emerald-500/50 shadow-emerald-950/50'
              : 'bg-rose-950/95 text-rose-200 border-rose-500/50 shadow-rose-950/50'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="mb-6 flex gap-4 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveView('LIST')}
          className={`px-4 py-2 rounded-lg font-medium transition ${activeView === 'LIST' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          <User className="w-4 h-4 inline-block mr-2" />
          Danh sách nhân sự
        </button>
        <button
          onClick={() => setActiveView('SCAN')}
          className={`px-4 py-2 rounded-lg font-medium transition ${activeView === 'SCAN' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          <ScanLine className="w-4 h-4 inline-block mr-2" />
          Quét QR Điểm danh
        </button>
        <button
          onClick={() => setActiveView('REPORT')}
          className={`px-4 py-2 rounded-lg font-medium transition ${activeView === 'REPORT' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          <FileText className="w-4 h-4 inline-block mr-2" />
          Bảng chấm công
        </button>
      </div>

      {activeView === 'LIST' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4">
              {isEditing ? "Cập nhật thông tin nhân viên" : "Thêm mới nhân viên"}
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-slate-400">Mã NV / QR Code</label>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setFormCode(`60000${Math.floor(1000 + Math.random() * 9000)}`)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 transition"
                      title="Tự động tạo mã nhân viên mới"
                    >
                      + Tạo mã tự động
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={formCode}
                  onChange={e => setFormCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Ví dụ: 600001001 (để trống để tự tạo)"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Nhập tên nhân viên"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Bộ phận</label>
                <select
                  value={formDivision}
                  onChange={(e) => setFormDivision(e.target.value as WorkerDivision)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="RO">Lắp ráp (RO)</option>
                  <option value="BG">Bếp Gas (BG)</option>
                  <option value="RMA">RMA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Loại nhân sự</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as WorkerType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="OFFICIAL">Chính thức (Tự động vào NS Chính thức)</option>
                  <option value="PROBATION">Thử việc (Tính là NS Chính thức)</option>
                  <option value="SEASONAL">Thời vụ (Tự động vào NS Thời vụ)</option>
                </select>
              </div>

              <button
                disabled={isSubmitting}
                onClick={handleSave}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 mt-4 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {isEditing ? "Đang cập nhật..." : "Đang lưu lên Supabase..."}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {isEditing ? "Cập nhật nhân viên" : "Thêm mới nhân viên"}
                  </>
                )}
              </button>

              {isEditing && (
                <button
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsEditing(false);
                    setEditId("");
                    setFormCode("");
                    setFormName("");
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-lg mt-2 transition"
                >
                  Hủy chỉnh sửa
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-white">Danh sách ({workers.length})</h3>
              <div className="flex gap-2 items-center flex-wrap">
                <button 
                  onClick={handleDownloadTemplate}
                  className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                  title="Tải file Excel mẫu đúng logic mới"
                >
                  <Download className="w-3.5 h-3.5" />
                  File Mẫu
                </button>
                <button 
                  onClick={handleExportWorkers}
                  className="text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                  title="Xuất danh sách nhân sự hiện tại ra Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  Xuất Excel
                </button>
                <label className="text-xs bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  Import Excel
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} />
                </label>
                <button 
                  disabled={isRefreshing}
                  onClick={handleReloadFromCloud}
                  className="text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                  title="Đồng bộ lại dữ liệu mới nhất từ Supabase Cloud"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                  {isRefreshing ? "Đang tải..." : "Tải lại từ Cloud"}
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-950 z-10 text-[11px] uppercase text-slate-400 font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-800">Mã NV</th>
                    <th className="px-4 py-3 border-b border-slate-800">Họ và tên</th>
                    <th className="px-4 py-3 border-b border-slate-800">Bộ phận</th>
                    <th className="px-4 py-3 border-b border-slate-800">Loại LĐ</th>
                    <th className="px-4 py-3 border-b border-slate-800 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {workers.map((w) => (
                    <tr key={w.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                      <td className="px-4 py-3 font-mono text-indigo-400">{w.qrCode}</td>
                      <td className="px-4 py-3 text-slate-200 font-medium">{w.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          w.division === 'RO' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' :
                          w.division === 'BG' ? 'bg-blue-950/50 text-blue-400 border border-blue-800/50' :
                          'bg-amber-950/50 text-amber-400 border border-amber-800/50'
                        }`}>
                          {w.division}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          w.type === 'OFFICIAL' ? 'bg-slate-800 text-slate-300' : 
                          w.type === 'SEASONAL' ? 'bg-purple-950/50 text-purple-400 border border-purple-800/50' : 
                          'bg-amber-950/50 text-amber-400 border border-amber-800/50'
                        }`}>
                          {w.type === 'OFFICIAL' ? 'Chính thức' : w.type === 'SEASONAL' ? 'Thời vụ' : 'Thử việc'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEdit(w)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 transition"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(w.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 transition ml-1"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {workers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Chưa có nhân viên nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeView === 'SCAN' && (
        <ScannerView 
          workers={workers} 
          attendanceLogs={attendanceLogs} 
          setAttendanceLogs={setAttendanceLogs} 
        />
      )}

      {activeView === 'REPORT' && (
        <ReportView 
          workers={workers} 
          attendanceLogs={attendanceLogs} 
          setAttendanceLogs={setAttendanceLogs}
        />
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Xác nhận xóa nhân viên</h3>
            <p className="text-slate-400 text-sm mb-6">
              Bạn có chắc chắn muốn xóa nhân viên <span className="text-rose-400 font-mono font-semibold">{deleteConfirmId}</span> khỏi hệ thống và Supabase Cloud? Thao tác này sẽ đồng bộ trực tiếp tới cơ sở dữ liệu.
            </p>
            <div className="flex justify-end gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
              >
                Hủy
              </button>
              <button
                disabled={isDeleting}
                onClick={() => confirmDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang xóa trên Supabase...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Xác nhận Xóa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Extracted Scanner View to manage its own effect lifecycle cleanly
const ScannerView = ({ workers, attendanceLogs, setAttendanceLogs }: { workers: Worker[], attendanceLogs: AttendanceRecord[], setAttendanceLogs: any }) => {
  const [scanDate, setScanDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [codeRO, setCodeRO] = useState("");
  const [codeBG, setCodeBG] = useState("");
  const [codeRMA, setCodeRMA] = useState("");
  const [cameraTargetDivision, setCameraTargetDivision] = useState<WorkerDivision>("RO");
  const [lastScanned, setLastScanned] = useState<{ worker: Worker, time: string, action: "IN" | "OUT" | "DONE", division: WorkerDivision } | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<{ log: AttendanceRecord, field: 'checkInTime' | 'checkOutTime' } | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [editTimeValue, setEditTimeValue] = useState("");
  const [editError, setEditError] = useState("");
  
  // Confirmation state for deleting records
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<
    | { type: 'SINGLE'; log: AttendanceRecord }
    | { type: 'ALL'; count: number; date: string }
    | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }
      
      let cameraIdOrConfig: any = { facingMode: "environment" };
      
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          // Try to find a back camera
          const backCamera = devices.find(d => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("sau"));
          if (backCamera) {
            cameraIdOrConfig = backCamera.id;
          } else {
            // Fallback to the first available camera if no "environment" or "back" label is found
            cameraIdOrConfig = devices[0].id;
          }
        }
      } catch (e) {
        console.warn("Could not get cameras list, falling back to facingMode constraint", e);
      }

      await scannerRef.current.start(
        cameraIdOrConfig,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // ignore scan frame errors
        }
      );
      setCameraActive(true);
    } catch (err: any) {
      console.error(err);
      setCameraError(err?.message || "Không thể truy cập camera. Vui lòng mở ứng dụng trong thẻ mới (New Tab) và cấp quyền truy cập máy ảnh.");
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setCameraActive(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const configRef = useRef({ scanDate, cameraTargetDivision });
  useEffect(() => {
    configRef.current = { scanDate, cameraTargetDivision };
  }, [scanDate, cameraTargetDivision]);

  const handleScanSuccess = (decodedText: string) => {
    processAttendance(decodedText, configRef.current.cameraTargetDivision);
  };

  const handleManualSubmit = (division: WorkerDivision, code: string, setter: (val: string) => void) => (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      processAttendance(code.trim(), division);
      setter("");
    }
  };

  const processAttendance = (code: string, targetDivision?: WorkerDivision) => {
    const worker = workers.find(w => w.qrCode === code || w.id === code);
    if (!worker) {
      alert(`Mã không hợp lệ: ${code}`);
      return;
    }

    const { scanDate: cd } = configRef.current;
    const finalDivision = targetDivision || worker.division;
    
    // Check if there is an active record (not checked out) for today
    const activeRecord = attendanceLogs.find(a => a.workerId === worker.id && a.date === cd && !a.checkOutTime);

    if (activeRecord) {
      if (activeRecord.scannedDivision === finalDivision) {
        // Checking out of the current division
        const updatedRecord = { ...activeRecord, checkOutTime: new Date().toISOString() };
        setAttendanceLogs((prev: AttendanceRecord[]) => prev.map(a => 
          a.id === activeRecord.id ? updatedRecord : a
        ));
        storage.saveAttendanceLog(updatedRecord);
        setLastScanned({ worker, action: "OUT", time: new Date().toLocaleTimeString(), division: finalDivision });
      } else {
        // Scanning into a NEW division without explicitly checking out of the old one
        // Case 2 Logic: If time spent in the previous division (activeRecord) is < 30 mins,
        // we merge it into the new division (delete the old record, start the new record from the old check-in time).
        // If >= 30 mins, we check out the old normally and start the new one now.
        const now = new Date();
        const prevCheckInTime = new Date(activeRecord.checkInTime);
        const diffMs = now.getTime() - prevCheckInTime.getTime();
        const diffMins = diffMs / 60000;

        if (diffMins < 30) {
          // Less than 30 mins: Delete old record, start new record using old check-in time
          const newRecord: AttendanceRecord = {
            id: Date.now().toString(),
            workerId: worker.id,
            date: cd,
            checkInTime: activeRecord.checkInTime, // keep the old start time
            scannedDivision: finalDivision
          };
          storage.deleteAttendanceLog(activeRecord.id);
          storage.saveAttendanceLog(newRecord);
          setAttendanceLogs((prev: AttendanceRecord[]) => {
            const filteredPrev = prev.filter(a => a.id !== activeRecord.id);
            return [...filteredPrev, newRecord];
          });
        } else {
          // 30 mins or more: Auto-checkout old record normally, start new record now
          const updatedOld: AttendanceRecord = { ...activeRecord, checkOutTime: now.toISOString() };
          const newRecord: AttendanceRecord = {
            id: Date.now().toString(),
            workerId: worker.id,
            date: cd,
            checkInTime: now.toISOString(),
            scannedDivision: finalDivision
          };
          storage.saveAttendanceLog(updatedOld);
          storage.saveAttendanceLog(newRecord);
          setAttendanceLogs((prev: AttendanceRecord[]) => {
            const updatedPrev = prev.map(a => 
              a.id === activeRecord.id ? updatedOld : a
            );
            return [...updatedPrev, newRecord];
          });
        }
        setLastScanned({ worker, action: "IN", time: now.toLocaleTimeString(), division: finalDivision });
      }
    } else {
      // Check in
      const newRecord: AttendanceRecord = {
        id: Date.now().toString(),
        workerId: worker.id,
        date: cd,
        checkInTime: new Date().toISOString(),
        scannedDivision: finalDivision
      };
      storage.saveAttendanceLog(newRecord);
      setAttendanceLogs((prev: AttendanceRecord[]) => [...prev, newRecord]);
      setLastScanned({ worker, action: "IN", time: new Date().toLocaleTimeString(), division: finalDivision });
    }
  };

  const openEditModal = (log: AttendanceRecord, field: 'checkInTime' | 'checkOutTime') => {
    setEditingLog({ log, field });
    const currentValue = log[field];
    const baseDate = currentValue ? new Date(currentValue) : new Date();
    setEditTimeValue(currentValue ? baseDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "");
    setEditPassword("");
    setEditError("");
    setEditModalOpen(true);
  };

  const handleConfirmEdit = () => {
    if (editPassword !== "RO2026") {
      setEditError("Mật khẩu không đúng!");
      return;
    }
    
    if (!editTimeValue.trim()) {
       setEditError("Vui lòng nhập giờ!");
       return;
    }
    
    const match = editTimeValue.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) {
      setEditError("Định dạng giờ không hợp lệ. Vui lòng nhập HH:mm (VD: 08:30)");
      return;
    }
    
    if (editingLog) {
      const { log, field } = editingLog;
      const currentValue = log[field];
      const baseDate = currentValue ? new Date(currentValue) : new Date();
      baseDate.setHours(parseInt(match[1]), parseInt(match[2]), 0, 0);
      
      const updatedLog: AttendanceRecord = { ...log, [field]: baseDate.toISOString() };
      setAttendanceLogs((prev: AttendanceRecord[]) => 
        prev.map(a => a.id === log.id ? updatedLog : a)
      );
      storage.saveAttendanceLog(updatedLog);
    }
    
    setEditModalOpen(false);
    setEditingLog(null);
  };

  const handleDeleteLog = (log: AttendanceRecord) => {
    setDeleteConfirmTarget({ type: 'SINGLE', log });
  };

  const handleDeleteAllCurrentLogs = () => {
    if (currentLogs.length === 0) return;
    setDeleteConfirmTarget({ type: 'ALL', count: currentLogs.length, date: scanDate });
  };

  const handleExecuteDeleteScanner = async () => {
    if (!deleteConfirmTarget) return;
    setIsDeleting(true);
    try {
      if (deleteConfirmTarget.type === 'SINGLE') {
        const log = deleteConfirmTarget.log;
        await storage.deleteAttendanceLog(log.id);
        setAttendanceLogs((prev: AttendanceRecord[]) => prev.filter(a => a.id !== log.id));
        if (lastScanned && lastScanned.worker.id === log.workerId) {
          setLastScanned(null);
        }
      } else {
        const targetDate = deleteConfirmTarget.date;
        const toDelete = attendanceLogs.filter(a => a.date === targetDate);
        for (const log of toDelete) {
          await storage.deleteAttendanceLog(log.id);
        }
        setAttendanceLogs((prev: AttendanceRecord[]) => prev.filter(a => a.date !== targetDate));
        setLastScanned(null);
      }
      setDeleteConfirmTarget(null);
    } catch (err: any) {
      console.error("Lỗi khi xóa:", err);
      alert(`Không thể xóa: ${err?.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const currentLogs = attendanceLogs.filter(a => a.date === scanDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Quét QR Code</h3>
        
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-400 mb-1">Ngày làm việc</label>
          <input 
            type="date"
            value={scanDate}
            onChange={e => setScanDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500"
          />
        </div>

        <div className="bg-black rounded-lg overflow-hidden border border-slate-800 min-h-[300px] relative flex flex-col items-center justify-center p-4">
          <div className="absolute top-2 right-2 z-10 bg-slate-900/80 px-3 py-1 rounded-full text-xs flex items-center gap-2 border border-slate-700 backdrop-blur">
            <span className="text-slate-400">Cam:</span>
            <select 
              value={cameraTargetDivision}
              onChange={e => setCameraTargetDivision(e.target.value as WorkerDivision)}
              className="bg-transparent text-emerald-400 font-bold outline-none cursor-pointer"
            >
              <option value="RO">RO</option>
              <option value="BG">BG</option>
              <option value="RMA">RMA</option>
            </select>
          </div>
          
          <div id="reader" className="w-full max-w-[400px]"></div>

          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-20 p-6 text-center">
              <Camera className="w-12 h-12 text-slate-500 mb-4" />
              {cameraError ? (
                <div className="text-red-400 text-sm mb-4 max-w-sm">
                  {cameraError}
                  <p className="mt-2 text-slate-400 text-xs">Hãy mở ứng dụng bằng trình duyệt Safari/Chrome, hoặc mở trong Tab mới (New Tab) để cấp quyền Camera.</p>
                </div>
              ) : (
                <p className="text-slate-400 mb-4">Camera đang tắt. Nhấn nút bên dưới để bắt đầu quét QR.</p>
              )}
              <button 
                onClick={startCamera}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Camera className="w-4 h-4" /> Bật Camera (Sau)
              </button>
            </div>
          )}

          {cameraActive && (
            <button 
              onClick={stopCamera}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-red-500/90 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-full flex items-center gap-2 transition-colors backdrop-blur"
            >
              Dừng Camera
            </button>
          )}
        </div>

        <div className="mt-6 border-t border-slate-800 pt-6">
          <label className="block text-sm font-bold text-emerald-400 mb-4 uppercase tracking-wide">
            ĐẶT CON TRỎ VÀO Ô ĐỂ DÙNG MÁY QUÉT (HOẶC NHẬP TAY)
          </label>
          <div className="flex flex-col gap-3">
            <form onSubmit={handleManualSubmit("RO", codeRO, setCodeRO)} className="flex items-center gap-3">
              <div className="w-16 text-center font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 py-2 rounded-lg">RO</div>
              <input 
                autoFocus
                type="text"
                value={codeRO}
                onChange={e => setCodeRO(e.target.value)}
                placeholder="Quét thẻ RO..."
                className="flex-1 bg-slate-950 border-2 border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-xl px-4 py-2.5 text-lg font-mono text-slate-200 outline-none transition-all shadow-inner"
              />
              <button type="submit" className="hidden">Quét</button>
            </form>

            <form onSubmit={handleManualSubmit("BG", codeBG, setCodeBG)} className="flex items-center gap-3">
              <div className="w-16 text-center font-bold text-blue-500 bg-blue-500/10 border border-blue-500/20 py-2 rounded-lg">BG</div>
              <input 
                type="text"
                value={codeBG}
                onChange={e => setCodeBG(e.target.value)}
                placeholder="Quét thẻ BG..."
                className="flex-1 bg-slate-950 border-2 border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl px-4 py-2.5 text-lg font-mono text-slate-200 outline-none transition-all shadow-inner"
              />
              <button type="submit" className="hidden">Quét</button>
            </form>

            <form onSubmit={handleManualSubmit("RMA", codeRMA, setCodeRMA)} className="flex items-center gap-3">
              <div className="w-16 text-center font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 py-2 rounded-lg">RMA</div>
              <input 
                type="text"
                value={codeRMA}
                onChange={e => setCodeRMA(e.target.value)}
                placeholder="Quét thẻ RMA..."
                className="flex-1 bg-slate-950 border-2 border-slate-700 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 rounded-xl px-4 py-2.5 text-lg font-mono text-slate-200 outline-none transition-all shadow-inner"
              />
              <button type="submit" className="hidden">Quét</button>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
        <h3 className="text-lg font-semibold text-white mb-4 flex justify-between items-center flex-wrap gap-2">
          <span>Trạng thái điểm danh</span>
          <div className="flex items-center gap-2">
            <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded-md">
              Đã điểm danh: <strong className="text-emerald-400">{new Set(currentLogs.map(a => a.workerId)).size}</strong> người <span className="text-slate-500 opacity-80 font-normal">({currentLogs.length} lượt)</span>
            </span>
            {currentLogs.length > 0 && (
              <button
                onClick={handleDeleteAllCurrentLogs}
                className="text-xs px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors flex items-center gap-1"
                title="Xóa tất cả các lượt điểm danh của ngày này"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa hết</span>
              </button>
            )}
          </div>
        </h3>

        {lastScanned && (
          <div className={`mb-4 p-4 border rounded-lg flex items-start gap-4 ${
            lastScanned.action === 'IN' ? 'bg-emerald-950/30 border-emerald-900' :
            lastScanned.action === 'OUT' ? 'bg-rose-950/30 border-rose-900' : 'bg-slate-800/50 border-slate-700'
          }`}>
            <div className="w-16 h-16 shrink-0 bg-slate-800 rounded overflow-hidden flex items-center justify-center border border-slate-700">
              {lastScanned.worker.imageUrl ? (
                <img src={lastScanned.worker.imageUrl} alt={lastScanned.worker.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-slate-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <span className={`text-sm font-bold ${
                  lastScanned.action === 'IN' ? 'text-emerald-400' :
                  lastScanned.action === 'OUT' ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {lastScanned.action === 'IN' ? '✓ Vào ca thành công' :
                   lastScanned.action === 'OUT' ? '✕ Ra ca thành công' : 'Đã kết thúc ca làm việc'}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    {lastScanned.division || lastScanned.worker.division}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                    lastScanned.worker.type === 'SEASONAL' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    lastScanned.worker.type === 'PROBATION' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                    'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {lastScanned.worker.type === 'SEASONAL' ? 'Thời vụ' : lastScanned.worker.type === 'PROBATION' ? 'Thử việc (Tính chính thức)' : 'Chính thức'}
                  </span>
                </div>
              </div>
              <div className="text-slate-200 font-medium text-lg">
                {lastScanned.worker.name}
              </div>
              <div className="text-slate-400 text-xs mt-1">
                Mã NV: <strong className="text-slate-200 font-mono">{lastScanned.worker.id}</strong> • Thời gian: {lastScanned.time}
              </div>
              <div className="text-emerald-400 text-xs font-semibold mt-1.5 flex items-center gap-1">
                <span>↳ Tự động nhập vào:</span>
                <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                  {lastScanned.division === 'RO'
                    ? (lastScanned.worker.type === 'SEASONAL' ? 'NS THỜI VỤ RO' : 'NS CHÍNH THỨC RO')
                    : lastScanned.division === 'BG'
                      ? (lastScanned.worker.type === 'SEASONAL' ? 'NS THỜI VỤ BG' : 'NS CHÍNH THỨC BG')
                      : (lastScanned.worker.type === 'SEASONAL' ? 'NS THỜI VỤ RMA' : 'NS CHÍNH THỨC RMA')}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-950 sticky top-0">
              <tr>
                <th className="px-3 py-2 border-b border-slate-800 text-slate-400 font-medium">Nhân viên</th>
                <th className="px-3 py-2 border-b border-slate-800 text-slate-400 font-medium">Giờ vào</th>
                <th className="px-3 py-2 border-b border-slate-800 text-slate-400 font-medium">Giờ ra</th>
                <th className="px-3 py-2 border-b border-slate-800 text-slate-400 font-medium text-center w-14">Xóa</th>
              </tr>
            </thead>
            <tbody>
              {currentLogs.map(log => {
                const w = workers.find(x => x.id === log.workerId);
                const scannedDiv = log.scannedDivision || w?.division;
                return (
                  <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 group">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-slate-800 overflow-hidden flex-shrink-0">
                          {w?.imageUrl ? (
                            <img src={w.imageUrl} alt={w.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 m-1 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white text-xs">
                            {w?.name || log.workerId}
                            {scannedDiv && (
                              <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                scannedDiv === 'RO' ? 'bg-emerald-500/20 text-emerald-400' :
                                scannedDiv === 'BG' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-amber-500/20 text-amber-400'
                              }`}>
                                {scannedDiv}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">{w?.id || log.workerId}</div>
                        </div>
                      </div>
                    </td>
                    <td 
                      className="px-3 py-2 text-emerald-400/80 text-xs font-mono cursor-pointer hover:bg-slate-800/40 hover:text-emerald-300 transition-colors"
                      onClick={() => openEditModal(log, 'checkInTime')}
                      title="Nhấn để sửa giờ vào"
                    >
                      {new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td 
                      className="px-3 py-2 text-rose-400/80 text-xs font-mono cursor-pointer hover:bg-slate-800/40 hover:text-rose-300 transition-colors"
                      onClick={() => openEditModal(log, 'checkOutTime')}
                      title="Nhấn để sửa giờ ra"
                    >
                      {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLog(log);
                        }}
                        title={`Xóa lượt điểm danh của ${w?.name || log.workerId}`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors inline-flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {currentLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                    Chưa có người điểm danh ngày này
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Time Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={() => setEditModalOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
              <span className="text-amber-400">🕒</span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Sửa {editingLog?.field === 'checkInTime' ? 'Giờ Vào' : 'Giờ Ra'}
              </h3>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Giờ mới (HH:mm)</label>
                <input
                  type="time"
                  value={editTimeValue}
                  onChange={(e) => setEditTimeValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Mật khẩu xác nhận</label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500"
                />
              </div>
              
              {editError && (
                <p className="text-rose-400 text-xs italic">{editError}</p>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
              <button 
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded text-xs transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleConfirmEdit}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-xs transition cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Scanner Deletion */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity cursor-pointer" 
            onClick={() => !isDeleting && setDeleteConfirmTarget(null)}
          />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {deleteConfirmTarget.type === 'SINGLE' ? 'Xác nhận xóa lượt điểm danh' : 'Xác nhận xóa tất cả điểm danh'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {deleteConfirmTarget.type === 'SINGLE' ? 'Thao tác sẽ xóa dữ liệu lượt điểm danh này' : `Xóa dữ liệu ngày ${deleteConfirmTarget.date}`}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {deleteConfirmTarget.type === 'SINGLE' ? (
                (() => {
                  const w = workers.find(x => x.id === deleteConfirmTarget.log.workerId);
                  const inTime = new Date(deleteConfirmTarget.log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const outTime = deleteConfirmTarget.log.checkOutTime ? new Date(deleteConfirmTarget.log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Chưa ra ca';
                  const div = deleteConfirmTarget.log.scannedDivision || w?.division;
                  return (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">{w?.name || deleteConfirmTarget.log.workerId}</span>
                        {div && (
                          <span className="text-xs px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {div}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        Mã NV: <span className="font-mono text-slate-300 font-medium">{w?.id || deleteConfirmTarget.log.workerId}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Giờ vào: <span className="font-mono text-emerald-400 font-medium">{inTime}</span> | Giờ ra: <span className="font-mono text-rose-400 font-medium">{outTime}</span>
                      </div>
                      <p className="text-xs text-amber-400/90 pt-2 border-t border-slate-800/80">
                        ⚠️ Bạn có chắc chắn muốn xóa lượt điểm danh này khỏi hệ thống không?
                      </p>
                    </div>
                  );
                })()
              ) : (
                <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-xl space-y-2 text-slate-300">
                  <p className="text-sm font-semibold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    Cảnh báo xóa dữ liệu hàng loạt!
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Bạn đang chuẩn bị xóa toàn bộ <strong className="text-white font-bold">{deleteConfirmTarget.count} lượt điểm danh</strong> của ngày <strong className="text-white font-bold">{deleteConfirmTarget.date}</strong>.
                  </p>
                  <p className="text-xs text-rose-400 font-semibold pt-1">
                    Thao tác này không thể hoàn tác sau khi thực hiện!
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs transition disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDeleteScanner}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-lg shadow-rose-950/50 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deleteConfirmTarget.type === 'SINGLE' ? 'Xác nhận xóa' : 'Xác nhận xóa tất cả'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const ReportView = ({ 
  workers, 
  attendanceLogs, 
  setAttendanceLogs 
}: { 
  workers: Worker[], 
  attendanceLogs: AttendanceRecord[], 
  setAttendanceLogs: React.Dispatch<React.SetStateAction<AttendanceRecord[]>> 
}) => {
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Confirmation state for ReportView deletion
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<
    | { type: 'WORKER'; workerId: string; workerName?: string; count: number }
    | { type: 'ALL'; date: string; count: number }
    | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteWorkerDay = (workerId: string, workerName?: string) => {
    const targetLogs = attendanceLogs.filter(a => a.date === reportDate && a.workerId === workerId);
    if (targetLogs.length === 0) return;
    setDeleteConfirmTarget({ type: 'WORKER', workerId, workerName, count: targetLogs.length });
  };

  const handleDeleteAllDay = () => {
    const targetLogs = attendanceLogs.filter(a => a.date === reportDate);
    if (targetLogs.length === 0) return;
    setDeleteConfirmTarget({ type: 'ALL', date: reportDate, count: targetLogs.length });
  };

  const handleExecuteDeleteReport = async () => {
    if (!deleteConfirmTarget) return;
    setIsDeleting(true);
    try {
      if (deleteConfirmTarget.type === 'WORKER') {
        const targetLogs = attendanceLogs.filter(a => a.date === reportDate && a.workerId === deleteConfirmTarget.workerId);
        for (const log of targetLogs) {
          await storage.deleteAttendanceLog(log.id);
        }
        setAttendanceLogs((prev: AttendanceRecord[]) => prev.filter(a => !(a.date === reportDate && a.workerId === deleteConfirmTarget.workerId)));
      } else {
        const targetLogs = attendanceLogs.filter(a => a.date === deleteConfirmTarget.date);
        for (const log of targetLogs) {
          await storage.deleteAttendanceLog(log.id);
        }
        setAttendanceLogs((prev: AttendanceRecord[]) => prev.filter(a => a.date !== deleteConfirmTarget.date));
      }
      setDeleteConfirmTarget(null);
    } catch (err: any) {
      console.error("Lỗi xóa chấm công:", err);
      alert(`Lỗi khi xóa: ${err?.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = (targetTable?: 'SEASONAL' | 'RO' | 'RMA_BG') => {
    const dailyLogs = attendanceLogs.filter(a => a.date === reportDate);
    if (dailyLogs.length === 0) {
      alert("Không có dữ liệu cho ngày này!");
      return;
    }

    const logsByWorker = dailyLogs.reduce((acc, log) => {
      if (!acc[log.workerId]) {
        acc[log.workerId] = {
          id: log.workerId,
          workerId: log.workerId,
          checkInTime: log.checkInTime,
          checkOutTime: log.checkOutTime,
          date: log.date,
          scannedDivision: log.scannedDivision
        };
      } else {
        if (new Date(log.checkInTime) < new Date(acc[log.workerId].checkInTime)) {
          acc[log.workerId].checkInTime = log.checkInTime;
        }
        if (!log.checkOutTime) {
          acc[log.workerId].checkOutTime = undefined;
          acc[log.workerId].scannedDivision = log.scannedDivision;
        } else if (acc[log.workerId].checkOutTime !== undefined) {
          if (new Date(log.checkOutTime) > new Date(acc[log.workerId].checkOutTime!)) {
            acc[log.workerId].checkOutTime = log.checkOutTime;
            acc[log.workerId].scannedDivision = log.scannedDivision;
          }
        }
      }
      return acc;
    }, {} as Record<string, { id: string, workerId: string, checkInTime: string, checkOutTime?: string, date: string, scannedDivision?: string }>);

    const allDisplayLogs = Object.values(logsByWorker);

    const isSeasonalCheck = (log: typeof allDisplayLogs[0]) => {
      const w = workers.find(x => x.id === log.workerId);
      return w?.type === 'SEASONAL' || 
        log.workerId.toUpperCase().includes('TV') || 
        log.workerId.toUpperCase().includes('THOIVU');
    };

    const isRoCheck = (log: typeof allDisplayLogs[0]) => {
      if (isSeasonalCheck(log)) return false;
      const w = workers.find(x => x.id === log.workerId);
      const div = log.scannedDivision || w?.division;
      return div !== 'BG' && div !== 'RMA';
    };

    const isRmaBgCheck = (log: typeof allDisplayLogs[0]) => {
      if (isSeasonalCheck(log)) return false;
      const w = workers.find(x => x.id === log.workerId);
      const div = log.scannedDivision || w?.division;
      return div === 'BG' || div === 'RMA';
    };

    const buildExportRows = (logs: typeof allDisplayLogs) => {
      return logs.map((log, index) => {
        const w = workers.find(x => x.id === log.workerId);
        const checkInTime = new Date(log.checkInTime).toLocaleTimeString();
        const checkOutTime = log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString() : "";
        
        let workDurationStr = "";
        let workHoursNum = 0;
        if (log.checkOutTime) {
          const diffMs = new Date(log.checkOutTime).getTime() - new Date(log.checkInTime).getTime();
          const diffHrs = Math.floor(diffMs / 3600000);
          const diffMins = Math.round((diffMs % 3600000) / 60000);
          workDurationStr = `${diffHrs}h ${diffMins}m`;
          workHoursNum = Number((diffMs / 3600000).toFixed(2));
        }

        return {
          "STT": index + 1,
          "Ngày": log.date,
          "Mã Nhân Viên": log.workerId,
          "Tên Nhân Viên": w?.name || "N/A",
          "Bộ Phận Gốc": w?.division || "N/A",
          "Loại Nhân Sự": w?.type === 'OFFICIAL' ? 'Chính thức' : w?.type === 'SEASONAL' ? 'Thời vụ' : 'Thử việc',
          "Vị Trí Làm Việc": log.scannedDivision || w?.division || "N/A",
          "Giờ Vào": checkInTime,
          "Giờ Ra": checkOutTime,
          "Số Giờ Làm (h)": workHoursNum,
          "Thời Gian Làm": workDurationStr,
        };
      });
    };

    const wb = XLSX.utils.book_new();
    const cols = [
      { wch: 5 }, { wch: 12 }, { wch: 16 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 16 }
    ];

    if (!targetTable || targetTable === 'SEASONAL') {
      const data = buildExportRows(allDisplayLogs.filter(isSeasonalCheck));
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = cols;
      XLSX.utils.book_append_sheet(wb, ws, "BangCong_ThoiVu");
    }

    if (!targetTable || targetTable === 'RO') {
      const data = buildExportRows(allDisplayLogs.filter(isRoCheck));
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = cols;
      XLSX.utils.book_append_sheet(wb, ws, "BangCong_RO");
    }

    if (!targetTable || targetTable === 'RMA_BG') {
      const data = buildExportRows(allDisplayLogs.filter(isRmaBgCheck));
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = cols;
      XLSX.utils.book_append_sheet(wb, ws, "BangCong_RMA_va_BG");
    }

    if (!targetTable) {
      const data = buildExportRows(allDisplayLogs);
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = cols;
      XLSX.utils.book_append_sheet(wb, ws, "TongHop_3_Bang");
    }

    const fileNameSuffix = targetTable ? `_${targetTable}` : '_3_Bang';
    XLSX.writeFile(wb, `Bang_Cham_Cong${fileNameSuffix}_${reportDate}.xlsx`);
  };

  const rawDailyLogs = attendanceLogs.filter(a => a.date === reportDate);
  const logsByWorkerForDisplay = rawDailyLogs.reduce((acc, log) => {
    if (!acc[log.workerId]) {
      acc[log.workerId] = {
        id: log.workerId,
        workerId: log.workerId,
        checkInTime: log.checkInTime,
        checkOutTime: log.checkOutTime,
        date: log.date,
        scannedDivision: log.scannedDivision
      };
    } else {
      if (new Date(log.checkInTime) < new Date(acc[log.workerId].checkInTime)) {
        acc[log.workerId].checkInTime = log.checkInTime;
      }
      if (!log.checkOutTime) {
        acc[log.workerId].checkOutTime = undefined;
        acc[log.workerId].scannedDivision = log.scannedDivision;
      } else if (acc[log.workerId].checkOutTime !== undefined) {
        if (new Date(log.checkOutTime) > new Date(acc[log.workerId].checkOutTime!)) {
          acc[log.workerId].checkOutTime = log.checkOutTime;
          acc[log.workerId].scannedDivision = log.scannedDivision;
        }
      }
    }
    return acc;
  }, {} as Record<string, { id: string, workerId: string, checkInTime: string, checkOutTime?: string, date: string, scannedDivision?: string }>);
  
  const dailyLogs = Object.values(logsByWorkerForDisplay);

  // PHÂN CHIA 3 BẢNG CÔNG CHUẨN LOGIC:
  // 1. Bảng công Thời vụ: Tất cả nhân sự thuộc diện Thời vụ
  const isSeasonalWorker = (log: typeof dailyLogs[0]) => {
    const w = workers.find(x => x.id === log.workerId);
    return w?.type === 'SEASONAL' || 
      log.workerId.toUpperCase().includes('TV') || 
      log.workerId.toUpperCase().includes('THOIVU');
  };

  // 2. Bảng công RO: Nhân sự chính thức/thử việc thuộc bộ phận RO
  const isRoWorker = (log: typeof dailyLogs[0]) => {
    if (isSeasonalWorker(log)) return false;
    const w = workers.find(x => x.id === log.workerId);
    const div = log.scannedDivision || w?.division;
    return div !== 'BG' && div !== 'RMA';
  };

  // 3. Bảng công RMA & BG: Nhân sự chính thức/thử việc thuộc bộ phận RMA hoặc Bếp Gas (BG)
  const isRmaBgWorker = (log: typeof dailyLogs[0]) => {
    if (isSeasonalWorker(log)) return false;
    const w = workers.find(x => x.id === log.workerId);
    const div = log.scannedDivision || w?.division;
    return div === 'BG' || div === 'RMA';
  };

  const seasonalLogs = dailyLogs.filter(isSeasonalWorker);
  const roLogs = dailyLogs.filter(isRoWorker);
  const rmaBgLogs = dailyLogs.filter(isRmaBgWorker);

  // Sub-tab filter: ALL, SEASONAL, RO, RMA_BG
  const [activeFilterTab, setActiveFilterTab] = useState<'ALL' | 'SEASONAL' | 'RO' | 'RMA_BG'>('ALL');

  // Hàm render bảng chi tiết cho từng nhóm với màu sắc nhẹ nhàng, dễ thấy rõ chữ
  const renderTableSection = (
    title: string,
    subDescription: string,
    badgeColor: string,
    headerBgColor: string,
    borderColor: string,
    titleColor: string,
    subTitleColor: string,
    iconBoxColor: string,
    exportBtnColor: string,
    icon: React.ReactNode,
    tableLogs: typeof dailyLogs,
    emptyMessage: string,
    exportKey: 'SEASONAL' | 'RO' | 'RMA_BG'
  ) => {
    const inShiftCount = tableLogs.filter(l => !l.checkOutTime).length;
    const completedCount = tableLogs.filter(l => !!l.checkOutTime).length;
    
    // Tính tổng số giờ làm của cả bảng
    const totalHoursWorked = tableLogs.reduce((sum, log) => {
      if (log.checkOutTime) {
        const diffMs = new Date(log.checkOutTime).getTime() - new Date(log.checkInTime).getTime();
        return sum + (diffMs / 3600000);
      }
      return sum;
    }, 0);

    return (
      <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm mb-6 transition-all ${borderColor}`}>
        {/* Tiêu đề Bảng với màu sắc nhẹ nhàng, tương phản cao */}
        <div className={`px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3 ${headerBgColor}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${iconBoxColor}`}>
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={`text-base font-bold tracking-tight ${titleColor}`}>{title}</h4>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
                  {tableLogs.length} nhân sự
                </span>
                {inShiftCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {inShiftCount} đang làm việc
                  </span>
                )}
                {completedCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                    {completedCount} đã ra ca
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 font-medium ${subTitleColor}`}>{subDescription}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalHoursWorked > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 font-mono shadow-sm">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Tổng: <strong className="text-slate-900 font-bold">{totalHoursWorked.toFixed(1)}h</strong></span>
              </div>
            )}
            <button
              onClick={() => handleExport(exportKey)}
              disabled={tableLogs.length === 0}
              className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition disabled:opacity-40 border shadow-sm font-medium ${exportBtnColor}`}
              title={`Xuất Excel riêng ${title}`}
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>

        {/* Nội dung bảng sáng sủa, chữ đậm nét, dễ đọc */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                <th className="px-4 py-3">Mã NV</th>
                <th className="px-4 py-3">Tên NV</th>
                <th className="px-4 py-3 text-center">Bộ phận làm việc</th>
                <th className="px-4 py-3 text-center">Loại nhân sự</th>
                <th className="px-4 py-3 text-center">Giờ vào</th>
                <th className="px-4 py-3 text-center">Giờ ra</th>
                <th className="px-4 py-3 text-center">Thời gian làm</th>
                <th className="px-4 py-3 text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm bg-white">
              {tableLogs.map((log) => {
                const w = workers.find(x => x.id === log.workerId);
                let workDurationStr = "-";
                if (log.checkOutTime) {
                  const diffMs = new Date(log.checkOutTime).getTime() - new Date(log.checkInTime).getTime();
                  const diffHrs = Math.floor(diffMs / 3600000);
                  const diffMins = Math.round((diffMs % 3600000) / 60000);
                  workDurationStr = `${diffHrs}h ${diffMins}m`;
                }

                const currentDiv = log.scannedDivision || w?.division || "RO";
                const workerType = w?.type || (isSeasonalWorker(log) ? 'SEASONAL' : 'OFFICIAL');

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 text-slate-900 font-mono text-sm font-semibold">{log.workerId}</td>
                    <td className="px-4 py-3.5 text-slate-900 font-medium text-sm">{w?.name || "N/A"}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-block ${
                        currentDiv === 'RO' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        currentDiv === 'BG' ? 'bg-sky-50 text-sky-800 border border-sky-200' :
                        'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {currentDiv === 'RO' ? 'Lắp ráp (RO)' : currentDiv === 'BG' ? 'Bếp Gas (BG)' : 'RMA'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-block ${
                        workerType === 'SEASONAL' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                        workerType === 'PROBATION' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {workerType === 'SEASONAL' ? 'Thời vụ' : workerType === 'PROBATION' ? 'Thử việc' : 'Chính thức'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-emerald-700 font-mono font-bold text-sm">
                      {new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-sm">
                      {log.checkOutTime ? (
                        <span className="text-rose-600 font-bold">
                          {new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs font-normal">Đang làm việc</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-800 font-mono font-bold text-sm">
                      {workDurationStr}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleDeleteWorkerDay(log.workerId, w?.name)}
                        title={`Xóa chấm công của ${w?.name || log.workerId} ngày ${reportDate}`}
                        className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition border border-rose-200 inline-flex items-center gap-1 text-xs font-medium shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Xóa</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {tableLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <p className="text-sm font-medium text-slate-600">{emptyMessage}</p>
                    <p className="text-xs text-slate-400 mt-1">Chưa có lượt quét mã QR nào cho nhóm này trong ngày {reportDate}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Header Điều Khiển & Bộ Lọc Báo Cáo */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-amber-500" />
              Bảng chấm công ngày
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Phân tách 3 bảng công: <strong className="text-purple-700 font-semibold">Thời vụ</strong>, <strong className="text-emerald-700 font-semibold">Chuyền RO</strong>, và <strong className="text-sky-700 font-semibold">RMA & Bếp Gas</strong>
            </p>
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none shadow-sm"
            />
            {dailyLogs.length > 0 && (
              <button
                onClick={handleDeleteAllDay}
                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3.5 py-2 rounded-xl font-medium text-sm transition shadow-sm"
                title="Xóa toàn bộ dữ liệu chấm công của ngày đang chọn"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa ngày ({dailyLogs.length})</span>
              </button>
            )}
            <button
              onClick={() => handleExport()}
              disabled={dailyLogs.length === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold transition text-sm shadow-sm disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              Xuất Excel (Cả 3 bảng)
            </button>
          </div>
        </div>

        {/* Thanh chuyển đổi / Lọc xem bảng */}
        <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Xem bảng:</span>
          
          <button
            onClick={() => setActiveFilterTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeFilterTab === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <span>Tất cả (3 bảng)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono font-bold ${
              activeFilterTab === 'ALL' ? 'bg-black/25 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {dailyLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilterTab('SEASONAL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeFilterTab === 'SEASONAL'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>1. Bảng công Thời vụ</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono font-bold ${
              activeFilterTab === 'SEASONAL' ? 'bg-purple-800 text-white' : 'bg-purple-100 text-purple-800 border border-purple-200'
            }`}>
              {seasonalLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilterTab('RO')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeFilterTab === 'RO'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Bảng công RO</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono font-bold ${
              activeFilterTab === 'RO' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {roLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilterTab('RMA_BG')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeFilterTab === 'RMA_BG'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>3. Bảng công RMA & BG</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono font-bold ${
              activeFilterTab === 'RMA_BG' ? 'bg-sky-800 text-white' : 'bg-sky-100 text-sky-800 border border-sky-200'
            }`}>
              {rmaBgLogs.length}
            </span>
          </button>
        </div>
      </div>

      {/* 3 BẢNG CHẤM CÔNG CHI TIẾT VỚI MÀU SẮC NHẸ NHÀNG DỄ NHÌN */}
      <div className="space-y-6">
        {/* 1. BẢNG CÔNG THỜI VỤ */}
        {(activeFilterTab === 'ALL' || activeFilterTab === 'SEASONAL') && (
          renderTableSection(
            "1. Bảng chấm công Thời Vụ",
            "Dành cho toàn bộ nhân sự lao động thời vụ (Thời vụ toàn xưởng)",
            "bg-purple-100 text-purple-800 border-purple-300",
            "bg-purple-50/75 border-purple-100",
            "border-purple-200/90",
            "text-purple-950",
            "text-purple-800/80",
            "bg-purple-100 text-purple-700 border-purple-200",
            "bg-white hover:bg-purple-50 text-purple-800 border-purple-200",
            <Users className="w-5 h-5 text-purple-700" />,
            seasonalLogs,
            "Chưa có nhân sự thời vụ nào điểm danh trong ngày này.",
            'SEASONAL'
          )
        )}

        {/* 2. BẢNG CÔNG RO */}
        {(activeFilterTab === 'ALL' || activeFilterTab === 'RO') && (
          renderTableSection(
            "2. Bảng chấm công Dây Chuyền RO",
            "Dành cho nhân sự chính thức & thử việc chuyền Lắp ráp Máy lọc nước RO",
            "bg-emerald-100 text-emerald-800 border-emerald-300",
            "bg-emerald-50/75 border-emerald-100",
            "border-emerald-200/90",
            "text-emerald-950",
            "text-emerald-800/80",
            "bg-emerald-100 text-emerald-700 border-emerald-200",
            "bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200",
            <Layers className="w-5 h-5 text-emerald-700" />,
            roLogs,
            "Chưa có nhân sự chuyền RO nào điểm danh trong ngày này.",
            'RO'
          )
        )}

        {/* 3. BẢNG CÔNG RMA VỚI BG */}
        {(activeFilterTab === 'ALL' || activeFilterTab === 'RMA_BG') && (
          renderTableSection(
            "3. Bảng chấm công RMA & Bếp Gas (BG)",
            "Dành cho nhân sự chính thức & thử việc bộ phận RMA và chuyền Bếp Gas",
            "bg-sky-100 text-sky-800 border-sky-300",
            "bg-sky-50/75 border-sky-100",
            "border-sky-200/90",
            "text-sky-950",
            "text-sky-800/80",
            "bg-sky-100 text-sky-700 border-sky-200",
            "bg-white hover:bg-sky-50 text-sky-800 border-sky-200",
            <Flame className="w-5 h-5 text-sky-700" />,
            rmaBgLogs,
            "Chưa có nhân sự bộ phận RMA hoặc Bếp Gas nào điểm danh trong ngày này.",
            'RMA_BG'
          )
        )}
      </div>

      {/* Confirmation Modal for ReportView Deletion */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity cursor-pointer" 
            onClick={() => !isDeleting && setDeleteConfirmTarget(null)}
          />
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {deleteConfirmTarget.type === 'WORKER' ? 'Xác nhận xóa chấm công nhân viên' : 'Xác nhận xóa tất cả dữ liệu ngày'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ngày làm việc: <strong className="text-slate-700">{reportDate}</strong>
                </p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {deleteConfirmTarget.type === 'WORKER' ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-sm font-semibold text-slate-800">
                    {deleteConfirmTarget.workerName || deleteConfirmTarget.workerId}
                  </div>
                  <div className="text-xs text-slate-600">
                    Mã NV: <span className="font-mono text-slate-800 font-semibold">{deleteConfirmTarget.workerId}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Số lượt quét liên quan: <span className="text-emerald-700 font-bold">{deleteConfirmTarget.count} lượt</span>
                  </div>
                  <p className="text-xs text-amber-700 pt-2 border-t border-slate-200 font-medium">
                    ⚠️ Bạn có chắc chắn muốn xóa toàn bộ chấm công của nhân viên này trong ngày {reportDate} không?
                  </p>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl space-y-2 text-slate-700">
                  <p className="text-sm font-bold text-rose-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    Cảnh báo xóa dữ liệu hàng loạt!
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Bạn đang chuẩn bị xóa toàn bộ <strong className="text-rose-800 font-bold">{deleteConfirmTarget.count} lượt chấm công</strong> của ngày <strong className="text-slate-900 font-bold">{deleteConfirmTarget.date}</strong>.
                  </p>
                  <p className="text-xs text-rose-600 font-semibold pt-1">
                    Thao tác này không thể hoàn tác sau khi thực hiện!
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-xs transition border border-slate-200 shadow-sm disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDeleteReport}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deleteConfirmTarget.type === 'WORKER' ? 'Xác nhận xóa' : 'Xác nhận xóa tất cả'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
