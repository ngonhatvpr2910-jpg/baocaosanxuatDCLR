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

export const ImeiTrackingTab = ({
  selectedDeclareDate,
  setSelectedDeclareDate,
  filteredDeclareProducts,
  selectedDeclareProductId,
  setSelectedDeclareProductId,
  declareImeiInput,
  setDeclareImeiInput,
  handleDeclareImeiSubmit,
  setImeiSubTab,
  imeiSubTab,
  scannedImeis,
  declaredImeis,
  filteredScannedImeis,
  imeiFilterDate,
  setImeiFilterDate,
  imeiSearchTerm,
  setImeiSearchTerm,
  products,
  deleteConfirmId,
  setScannedImeis,
  setDeleteConfirmId,
  filteredDeclaredImeis,
  declareFilterDate,
  setDeclareFilterDate,
  declareSearchTerm,
  setDeclareSearchTerm,
  deleteDeclareConfirmImei,
  setDeclaredImeis,
  setDeleteDeclareConfirmImei,
  comparisonRecords,
  setCompareStatusFilter,
  compareStatusFilter,
  filteredComparisonRecords
}: any) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Barcode className="w-6 h-6 text-rose-500" />
                Theo Dõi IMEI Sản Xuất
              </h2>
              <p className="text-sm text-slate-400">
                Danh sách các mã IMEI đã quét và lưu vào hệ thống.
              </p>
            </div>


            {/* KHAI BÁO IMEI */}
            <div className="bg-slate-900/30 rounded-xl border border-slate-800/60 overflow-hidden flex flex-col p-4 space-y-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                Khai Báo IMEI KHSX
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ngày KHSX</label>
                  <input
                    type="date"
                    id="declareImeiDate"
                    value={selectedDeclareDate}
                    onChange={(e) => setSelectedDeclareDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mã Sản Phẩm {filteredDeclareProducts.length === 0 && <span className="text-rose-500 normal-case">(Chưa có KHSX ngày này)</span>}</label>
                  <select
                    id="declareImeiProduct"
                    value={selectedDeclareProductId}
                    onChange={(e) => setSelectedDeclareProductId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-sans"
                  >
                    {filteredDeclareProducts.length > 0 ? (
                      filteredDeclareProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                      ))
                    ) : (
                      <option value="">-- Không có model sản xuất --</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                {/* Quick Scan Input */}
                <div className="bg-slate-900/40 p-5 rounded-lg border border-slate-800 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quét IMEI Khai Báo (KHSX)</label>
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-700/60 flex items-center justify-center">
                        <Barcode className="w-6 h-6 text-emerald-500" />
                      </div>
                      <input
                        type="text"
                        id="declareImeiInputEl"
                        placeholder={filteredDeclareProducts.length > 0 ? "Quét IMEI vào đây để lưu trực tiếp vào danh sách..." : "Không có KHSX - Vui lòng chọn ngày khác..."}
                        value={declareImeiInput}
                        disabled={filteredDeclareProducts.length === 0}
                        onChange={(e) => setDeclareImeiInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleDeclareImeiSubmit(declareImeiInput);
                          }
                        }}
                        className={`flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-white font-mono focus:border-emerald-500 outline-none placeholder-slate-600 text-sm shadow-inner ${filteredDeclareProducts.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      <button
                        type="button"
                        disabled={filteredDeclareProducts.length === 0}
                        onClick={() => handleDeclareImeiSubmit(declareImeiInput)}
                        className={`bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-xl flex items-center justify-center shrink-0 text-sm cursor-pointer transition-all active:scale-95 shadow-lg shadow-emerald-900/20 ${filteredDeclareProducts.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Ghi Nhận
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-[11px] text-slate-500 italic bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                    <span className="text-emerald-500 font-bold not-italic">HƯỚNG DẪN:</span>
                    <p>Đặt con trỏ vào ô nhập liệu và sử dụng máy quét. Mỗi mã IMEI hợp lệ sẽ được hệ thống kiểm tra đối chiếu KHSX và tự động lưu trực tiếp vào bảng danh sách phía dưới.</p>
                  </div>
                </div>
              </div>

            </div>

            <div className="bg-slate-900/30 rounded-xl border border-slate-800/60 overflow-hidden flex flex-col">
              {/* SUB-TABS SELECTOR */}
              <div className="flex border-b border-slate-200 bg-slate-100 p-1 gap-1">
                <button
                  onClick={() => setImeiSubTab("scanned")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    imeiSubTab === "scanned"
                      ? "bg-rose-600 text-white shadow shadow-rose-600/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <ScanBarcode className="w-4 h-4" />
                  Lịch Sử Quét Thực Tế ({scannedImeis.length})
                </button>
                <button
                  onClick={() => setImeiSubTab("declared")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    imeiSubTab === "declared"
                      ? "bg-emerald-600 text-white shadow shadow-emerald-600/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Danh Sách Khai Báo ({declaredImeis.length})
                </button>
                <button
                  onClick={() => setImeiSubTab("compare")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    imeiSubTab === "compare"
                      ? "bg-sky-600 text-white shadow shadow-sky-600/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Đối Chiếu & So Sánh Số Liệu
                </button>
              </div>

              {/* VIEW 1: SCANNED HISTORY */}
              {imeiSubTab === "scanned" && (
                <>
                  <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                     <div>
                       <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                          <List className="w-4 h-4 text-rose-500" />
                          Lịch Sử Quét ({filteredScannedImeis.length})
                       </h3>
                       <p className="text-[11px] text-slate-400 mt-1">Truy xuất danh sách IMEI thực tế sản xuất tại xưởng.</p>
                     </div>
                     <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={imeiFilterDate}
                          onChange={(e) => setImeiFilterDate(e.target.value)}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                        />
                        <input
                          type="text"
                          placeholder="Tìm nhanh IMEI, Model..."
                          value={imeiSearchTerm}
                          onChange={(e) => setImeiSearchTerm(e.target.value)}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                        />
                     </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800">
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Thời Gian</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Mã IMEI</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Mã Model</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Tên Sản Phẩm</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Khung Giờ</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filteredScannedImeis.length > 0 ? (
                          filteredScannedImeis.map((item) => {
                            const prod = products.find(p => p.id === item.productId);
                            return (
                              <tr key={item.id} className="hover:bg-slate-900/50 transition">
                                <td className="p-3 text-sm text-slate-300 font-mono">
                                   {new Date(item.timestamp).toLocaleString("vi-VN")}
                                </td>
                                <td className="p-3 text-sm text-emerald-400 font-mono font-bold">
                                   {item.imei}
                                </td>
                                <td className="p-3 text-sm text-slate-200">
                                   {prod?.code || item.productId}
                                </td>
                                <td className="p-3 text-sm text-slate-400 truncate max-w-[200px]" title={prod?.name || "N/A"}>
                                   {prod?.name || "N/A"}
                                </td>
                                <td className="p-3 text-sm text-rose-400 font-mono">
                                   {item.slot}
                                </td>
                                <td className="p-3 text-right">
                                   {deleteConfirmId === item.id ? (
                                     <div className="flex items-center justify-end gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                                       <span className="text-[10px] text-slate-400 font-sans">Xóa?</span>
                                       <button
                                         onClick={() => {
                                           setScannedImeis(prev => prev.filter(x => x.id !== item.id));
                                           setDeleteConfirmId(null);
                                         }}
                                         className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer"
                                       >
                                         Xác Nhận
                                       </button>
                                       <button
                                         onClick={() => setDeleteConfirmId(null)}
                                         className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer"
                                       >
                                         Hủy
                                       </button>
                                     </div>
                                   ) : (
                                     <button 
                                       onClick={() => setDeleteConfirmId(item.id)}
                                       className="text-rose-500 hover:text-rose-400 p-1 cursor-pointer"
                                       title="Xóa"
                                     >
                                       <Trash2 className="w-4 h-4" />
                                     </button>
                                   )}
                                 </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr key="empty-scanned-imeis">
                            <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                              Chưa có dữ liệu IMEI nào được quét phù hợp với bộ lọc.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* VIEW 2: DECLARED HISTORY */}
              {imeiSubTab === "declared" && (
                <>
                  <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                     <div>
                       <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-emerald-500" />
                          Danh Sách IMEI Đã Khai Báo KHSX ({filteredDeclaredImeis.length})
                       </h3>
                       <p className="text-[11px] text-slate-400 mt-1">Truy xuất kế hoạch sản xuất IMEI đã được nạp trước.</p>
                     </div>
                     <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={declareFilterDate}
                          onChange={(e) => setDeclareFilterDate(e.target.value)}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                        <input
                          type="text"
                          placeholder="Tìm nhanh IMEI, Model..."
                          value={declareSearchTerm}
                          onChange={(e) => setDeclareSearchTerm(e.target.value)}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                     </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800">
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày Khai Báo</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Mã IMEI</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Mã Model</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Tên Sản Phẩm</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng Thái</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filteredDeclaredImeis.length > 0 ? (
                          filteredDeclaredImeis.map((item, index) => {
                            const prod = products.find(p => p.id === item.productId);
                            const isAlreadyScanned = scannedImeis.some(s => s.imei === item.imei);
                            return (
                              <tr key={`${item.imei}-${index}`} className="hover:bg-slate-900/50 transition">
                                <td className="p-3 text-sm text-slate-300 font-mono">
                                   {item.date}
                                </td>
                                <td className="p-3 text-sm text-emerald-400 font-mono font-bold">
                                   {item.imei}
                                </td>
                                <td className="p-3 text-sm text-slate-200">
                                   {prod?.code || item.productId}
                                </td>
                                <td className="p-3 text-sm text-slate-400 truncate max-w-[200px]" title={prod?.name || "N/A"}>
                                   {prod?.name || "N/A"}
                                </td>
                                <td className="p-3 text-xs">
                                   {isAlreadyScanned ? (
                                     <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                                       Đã Quét Thực Tế
                                     </span>
                                   ) : (
                                     <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                                       Chưa Sản Xuất
                                     </span>
                                   )}
                                </td>
                                <td className="p-3 text-right">
                                   {deleteDeclareConfirmImei === item.imei ? (
                                     <div className="flex items-center justify-end gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                                       <span className="text-[10px] text-slate-400 font-sans">Xóa?</span>
                                       <button
                                         onClick={() => {
                                           setDeclaredImeis(prev => prev.filter(x => x.imei !== item.imei));
                                           setDeleteDeclareConfirmImei(null);
                                         }}
                                         className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer"
                                       >
                                         Xác Nhận
                                       </button>
                                       <button
                                         onClick={() => setDeleteDeclareConfirmImei(null)}
                                         className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer"
                                       >
                                         Hủy
                                       </button>
                                     </div>
                                   ) : (
                                     <button 
                                       onClick={() => setDeleteDeclareConfirmImei(item.imei)}
                                       className="text-rose-500 hover:text-rose-400 p-1 cursor-pointer"
                                       title="Xóa Khai Báo"
                                     >
                                       <Trash2 className="w-4 h-4" />
                                     </button>
                                   )}
                                 </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr key="empty-declared-imeis">
                            <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                              Không tìm thấy IMEI khai báo nào phù hợp với bộ lọc.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* VIEW 3: DETAILED COMPARISON AND DISCREPANCY ANALYSIS */}
              {imeiSubTab === "compare" && (
                <>
                  {/* METRICS PANEL */}
                  <div className="p-4 bg-slate-900/40 border-b border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800/60">
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Tổng IMEI Khai Báo</div>
                      <div className="text-lg font-bold text-white mt-0.5 font-mono">
                        {comparisonRecords.filter(r => r.status === "matched" || r.status === "missing").length}
                      </div>
                    </div>
                    <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800/60">
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Thực Tế Đã Quét</div>
                      <div className="text-lg font-bold text-rose-400 mt-0.5 font-mono">
                        {scannedImeis.length}
                      </div>
                    </div>
                    <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800/60">
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Đã Trùng Khớp</div>
                      <div className="text-lg font-bold text-emerald-400 mt-0.5 font-mono">
                        {comparisonRecords.filter(r => r.status === "matched").length}
                      </div>
                    </div>
                    <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800/60">
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Tỷ Lệ Trùng Khớp</div>
                      <div className="text-lg font-bold text-sky-400 mt-0.5 font-mono">
                        {(() => {
                          const declCount = comparisonRecords.filter(r => r.status === "matched" || r.status === "missing").length;
                          const matchedCount = comparisonRecords.filter(r => r.status === "matched").length;
                          return declCount > 0 ? `${Math.round((matchedCount / declCount) * 100)}%` : "0%";
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* CONTROLS AREA */}
                  <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/20">
                     <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">Lọc Trạng Thái:</span>
                        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 gap-1 flex-wrap">
                          <button
                            onClick={() => setCompareStatusFilter("all")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                              compareStatusFilter === "all" ? "bg-slate-800 text-white" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                          >
                            Tất cả ({filteredComparisonRecords.length})
                          </button>
                          <button
                            onClick={() => setCompareStatusFilter("matched")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                              compareStatusFilter === "matched" ? "bg-emerald-950 text-emerald-400 border border-emerald-800/30" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                          >
                            Khớp ({comparisonRecords.filter(r => r.status === "matched").length})
                          </button>
                          <button
                            onClick={() => setCompareStatusFilter("missing")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                              compareStatusFilter === "missing" ? "bg-amber-950 text-amber-400 border border-amber-800/30" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                          >
                            Sót / Chưa Quét ({comparisonRecords.filter(r => r.status === "missing").length})
                          </button>
                          <button
                            onClick={() => setCompareStatusFilter("un-declared")}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                              compareStatusFilter === "un-declared" ? "bg-rose-950 text-rose-400 border border-rose-800/30" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                          >
                            Quét Ngoài KHSX ({comparisonRecords.filter(r => r.status === "un-declared").length})
                          </button>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={imeiFilterDate}
                          onChange={(e) => setImeiFilterDate(e.target.value)}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
                        />
                        <input
                          type="text"
                          placeholder="Tra cứu IMEI..."
                          value={imeiSearchTerm}
                          onChange={(e) => setImeiSearchTerm(e.target.value)}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                        />
                        <button
                          onClick={() => {
                            const dataToExport = filteredComparisonRecords.map(r => {
                              const prod = products.find(p => p.id === r.productId);
                              const statusText = r.status === "matched" ? "Đã khớp (Đã sản xuất)" :
                                                 r.status === "missing" ? "Thiếu (Chưa quét)" : "Quét ngoài KHSX";
                              return {
                                "Mã IMEI": r.imei,
                                "Mã Sản Phẩm": prod?.code || r.productId,
                                "Tên Sản Phẩm": prod?.name || "N/A",
                                "Ngày Khai Báo (KHSX)": r.declareDate || "N/A",
                                "Thời Gian Quét Thực Tế": r.scanTimestamp ? new Date(r.scanTimestamp).toLocaleString("vi-VN") : "N/A",
                                "Khung Giờ Quét": r.scanSlot || "N/A",
                                "Trạng Thái Đối Chiếu": statusText
                              };
                            });

                            const ws = XLSX.utils.json_to_sheet(dataToExport);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "Doi_Chieu_IMEI");
                            XLSX.writeFile(wb, `Doi_Chieu_IMEI_Sunhouse_${imeiFilterDate || "Tat_Ca"}.xlsx`);
                          }}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          Xuất File Đối Chiếu (Excel)
                        </button>
                     </div>
                  </div>

                  {/* COMPARISON TABLE */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800">
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Mã IMEI</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Mã Model</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Tên Sản Phẩm</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày Khai Báo (KHSX)</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Thời Gian Quét</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Khung Giờ Quét</th>
                          <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Kết Quả Đối Chiếu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filteredComparisonRecords.length > 0 ? (
                          filteredComparisonRecords.map((item, idx) => {
                            const prod = products.find(p => p.id === item.productId);
                            return (
                              <tr key={`${item.imei}-${idx}`} className="hover:bg-slate-900/50 transition">
                                <td className="p-3 text-sm text-slate-100 font-mono font-bold">
                                   {item.imei}
                                </td>
                                <td className="p-3 text-sm text-slate-300">
                                   {prod?.code || item.productId}
                                </td>
                                <td className="p-3 text-sm text-slate-400 truncate max-w-[200px]" title={prod?.name || "N/A"}>
                                   {prod?.name || "N/A"}
                                </td>
                                <td className="p-3 text-sm text-slate-400 font-mono">
                                   {item.declareDate || <span className="text-slate-600 font-sans">— (Không khai báo)</span>}
                                </td>
                                <td className="p-3 text-sm text-slate-400 font-mono">
                                   {item.scanTimestamp ? new Date(item.scanTimestamp).toLocaleString("vi-VN") : <span className="text-slate-600 font-sans">— (Chưa sản xuất)</span>}
                                </td>
                                <td className="p-3 text-sm text-rose-400 font-mono">
                                   {item.scanSlot || <span className="text-slate-600 font-sans">—</span>}
                                </td>
                                <td className="p-3 text-xs">
                                  {item.status === "matched" && (
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1 w-fit">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                      Đã Khớp (Đúng KHSX)
                                    </span>
                                  )}
                                  {item.status === "missing" && (
                                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold flex items-center gap-1 w-fit">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                      Sót (Chưa Sản Xuất)
                                    </span>
                                  )}
                                  {item.status === "un-declared" && (
                                    <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold flex items-center gap-1 w-fit">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                                      Quét Ngoài KHSX
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr key="empty-comparison-records">
                            <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                              Không tìm thấy bản ghi đối chiếu nào phù hợp.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
  );
};
