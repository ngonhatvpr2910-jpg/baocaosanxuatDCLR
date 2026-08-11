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

export const ProductsTab = ({
  setEditingProductId,
  setProdFormName,
  setProdFormCode,
  setProdFormGroup,
  setProdFormFactor,
  setProdFormPrice,
  setProdFormDescription,
  setProdFormMessage,
  handleExportProducts,
  handleExcelUpload,
  excelImportError,
  excelImportSuccess,
  parsedExcelProducts,
  handleCancelExcelImport,
  handleConfirmExcelImport,
  products,
  editingProductId,
  handleEditProductClick,
  handleDeleteProduct,
  prodFormMessage,
  handleSaveProduct,
  prodFormGroup,
  prodFormCode,
  prodFormName,
  prodFormFactor,
  prodFormPrice,
  prodFormDescription,
  handleCancelProductEdit
}: any) => {
  return (
    <motion.div
              key="products"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="border-b border-slate-100 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-rose-600" />
                      Cấu Hình Danh Mục Sản Phẩm & Hệ Số Quy Đổi
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Cập nhật Model, Mã code, Hệ số quy đổi tính công suất IE và Giá bán sản phẩm được đồng bộ trong toàn hệ thống.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProductId(null);
                      setProdFormName("");
                      setProdFormCode("");
                      setProdFormGroup("MLN");
                      setProdFormFactor(1.0);
                      setProdFormPrice(2000000);
                      setProdFormDescription("");
                      setProdFormMessage("");
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                  >
                    <span>➕ Thêm Sản Phẩm Mới</span>
                  </button>
                </div>

                {/* EXCEL IMPORT AREA */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        Nhập sản phẩm hàng loạt từ File Excel
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Xuất danh sách sản phẩm hiện có ra Excel hoặc chọn file để cập nhật/nhập mới hàng loạt vào hệ thống.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleExportProducts}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="Xuất danh sách sản phẩm ra Excel"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        Cho phép xuất Excel
                      </button>
                      
                      <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        Chọn file Excel...
                        <input
                          id="excel-product-upload"
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleExcelUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Excel Error & Success Logs */}
                  {excelImportError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2 animate-pulse">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>{excelImportError}</div>
                    </div>
                  )}

                  {excelImportSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>{excelImportSuccess}</div>
                    </div>
                  )}

                  {/* Excel Parsed Products Preview Table */}
                  {parsedExcelProducts.length > 0 && (
                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white mt-4 shadow-sm">
                      <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          📋 Xem trước danh sách chuẩn bị nhập ({parsedExcelProducts.length} dòng)
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={handleCancelExcelImport}
                            className="px-2.5 py-1 text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded cursor-pointer transition"
                          >
                            Hủy bỏ
                          </button>
                          <button
                            onClick={handleConfirmExcelImport}
                            className="px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded flex items-center gap-1 cursor-pointer transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Xác nhận nhập
                          </button>
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                              <th className="py-2 px-3">Phân nhóm</th>
                              <th className="py-2 px-3">Mã Model</th>
                              <th className="py-2 px-3">Tên sản phẩm đầy đủ</th>
                              <th className="py-2 px-3 text-center">Hệ số quy đổi</th>
                              <th className="py-2 px-3 text-right">Giá bán dự kiến</th>
                              <th className="py-2 px-3">Mô tả / Ghi chú</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {parsedExcelProducts.map((p, index) => (
                              <tr key={index} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 font-semibold text-slate-700">{p.group === "MLN" ? "DCRO" : p.group === "RMA" ? "DCRMA" : "DCBG"}</td>
                                <td className="py-2 px-3 font-mono font-bold text-slate-950">{p.code}</td>
                                <td className="py-2 px-3 truncate max-w-[180px]" title={p.name}>{p.name}</td>
                                <td className="py-2 px-3 text-center font-bold text-rose-600 font-mono">{p.factor.toFixed(2)}</td>
                                <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                                  {p.price ? p.price.toLocaleString("vi-VN") + " ₫" : "-"}
                                </td>
                                <td className="py-2 px-3 truncate max-w-[150px] text-slate-400" title={p.description}>{p.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* LEFT COLUMN: PRODUCT LIST */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <th className="py-3 px-4">Nhóm</th>
                            <th className="py-3 px-4">Mã Model</th>
                            <th className="py-3 px-4">Tên Sản Phẩm đầy đủ</th>
                            <th className="py-3 px-4 text-center">Hệ số quy đổi</th>
                            <th className="py-3 px-4 text-right">Giá bán (VND)</th>
                            <th className="py-3 px-4 text-center">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
                          {products.map((prod) => (
                            <tr
                              key={prod.id}
                              className={`hover:bg-slate-50/50 transition ${
                                editingProductId === prod.id ? "bg-rose-50/50 font-medium" : ""
                              }`}
                            >
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    prod.group === "MLN"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-sky-50 text-sky-700 border border-sky-200"
                                  }`}
                                >
                                  {prod.group === "MLN" ? "DCRO" : prod.group === "RMA" ? "DCRMA" : "DCBG"}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-950">
                                {prod.code || getProductModelCode(prod.name)}
                              </td>
                              <td className="py-3 px-4 text-slate-800 max-w-xs truncate" title={prod.name}>
                                {prod.name}
                              </td>
                              <td className="py-3 px-4 text-center font-mono font-bold text-rose-600">
                                {prod.factor.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                                {prod.price ? prod.price.toLocaleString("vi-VN") + " ₫" : "-"}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleEditProductClick(prod)}
                                    className="p-1 text-slate-500 hover:text-slate-950 hover:bg-slate-100 rounded transition cursor-pointer"
                                    title="Sửa sản phẩm"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                                    title="Xóa sản phẩm"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: EDITOR FORM */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 h-fit space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {editingProductId ? "📝 Cập Nhật Thông Tin" : "➕ Thêm Sản Phẩm Mới"}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {editingProductId ? `Đang chỉnh sửa sản phẩm` : "Điền thông tin để tạo dòng sản phẩm mới"}
                      </p>
                    </div>

                    {prodFormMessage && (
                      <div
                        className={`p-3 rounded-lg text-xs font-medium border ${
                          prodFormMessage.startsWith("✅")
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}
                      >
                        {prodFormMessage}
                      </div>
                    )}

                    <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="block font-medium text-slate-700 uppercase tracking-wider text-[10px]">
                          Phân nhóm sản phẩm
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setProdFormGroup("MLN")}
                            className={`py-2 rounded-lg font-bold border transition text-[11px] ${
                              prodFormGroup === "MLN"
                                ? "bg-white border-rose-600 text-rose-600 shadow-sm"
                                : "bg-slate-100 border-transparent text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            🌊 DCRO (MLN)
                          </button>
                          <button
                            type="button"
                            onClick={() => setProdFormGroup("RMA")}
                            className={`py-2 rounded-lg font-bold border transition text-[11px] ${
                              prodFormGroup === "RMA"
                                ? "bg-white border-rose-600 text-rose-600 shadow-sm"
                                : "bg-slate-100 border-transparent text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            ♻️ DCRMA (RMA/RW)
                          </button>
                          <button
                            type="button"
                            onClick={() => setProdFormGroup("BG")}
                            className={`py-2 rounded-lg font-bold border transition text-[11px] ${
                              prodFormGroup === "BG"
                                ? "bg-white border-rose-600 text-rose-600 shadow-sm"
                                : "bg-slate-100 border-transparent text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            🔥 Bếp Gas (BG)
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-medium text-slate-700 uppercase tracking-wider text-[10px]">
                          Mã Model (Code)
                        </label>
                        <input
                          type="text"
                          value={prodFormCode}
                          onChange={(e) => setProdFormCode(e.target.value)}
                          placeholder="Ví dụ: RMVSHA76222KL, BBDMMB3569MT..."
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600 font-mono text-sm uppercase"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-medium text-slate-700 uppercase tracking-wider text-[10px]">
                          Tên đầy đủ sản phẩm
                        </label>
                        <textarea
                          rows={2}
                          value={prodFormName}
                          onChange={(e) => setProdFormName(e.target.value)}
                          placeholder="Ví dụ: Máy lọc nước RO UltraPURE Sunhouse 11 lõi SHA76222KL..."
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block font-medium text-slate-700 uppercase tracking-wider text-[10px]">
                            Hệ số quy đổi (Factor)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="10.00"
                            value={Number.isNaN(prodFormFactor) ? "" : prodFormFactor}
                            onChange={(e) => setProdFormFactor(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600 font-mono text-sm font-bold text-rose-600"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block font-medium text-slate-700 uppercase tracking-wider text-[10px]">
                            Giá bán (VND)
                          </label>
                          <input
                            type="number"
                            step="1000"
                            min="0"
                            value={Number.isNaN(prodFormPrice) ? "" : prodFormPrice}
                            onChange={(e) => setProdFormPrice(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600 font-mono text-sm font-bold"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-medium text-slate-700 uppercase tracking-wider text-[10px]">
                          Mô tả / Ghi chú khác
                        </label>
                        <textarea
                          rows={2}
                          value={prodFormDescription}
                          onChange={(e) => setProdFormDescription(e.target.value)}
                          placeholder="Nhập mô tả chi tiết..."
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {editingProductId && (
                          <button
                            type="button"
                            onClick={handleCancelProductEdit}
                            className="py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition cursor-pointer"
                          >
                            Hủy
                          </button>
                        )}
                        <button
                          type="submit"
                          className={`py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition shadow-md cursor-pointer ${
                            !editingProductId ? "col-span-2" : ""
                          }`}
                        >
                          💾 {editingProductId ? "Cập Nhật" : "Lưu Sản Phẩm"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
  );
};
