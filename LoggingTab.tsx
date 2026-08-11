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

export const LoggingTab = ({
  formMessage,
  handleAddLog,
  formDate,
  handleDateChange,
  formShift,
  handleShiftChange,
  formLineId,
  setFormLineId,
  formTechnician,
  setFormTechnician,
  newSlotInput,
  setNewSlotInput,
  handleAddSlot,
  scanInput,
  setScanInput,
  handleScanSubmit,
  formSlots,
  handleDeleteSlot,
  formModelItems,
  filterDivision,
  products,
  handleUpdateItem,
  handleUpdateItemHourly,
  getPrevDayLeftover,
  handleRemoveItem,
  handleAddNewItem,
  displayTotalActualQty,
  displayTotalPlanQty,
  displayTotalRemainingQty,
  displayTotalEqQty,
  formOfficialWorkersRO,
  formSeasonalWorkersRO,
  formAggregates,
  formOfficialWorkersRMA,
  formSeasonalWorkersRMA,
  formOfficialWorkersBG,
  formSeasonalWorkersBG,
  handleUpdateOfficialWorkerRO,
  formOfficialCountRO,
  handleUpdateSeasonalWorkerRO,
  formSeasonalCountRO,
  formWorkersCountRO,
  handleUpdateOfficialWorkerRMA,
  formOfficialCountRMA,
  handleUpdateSeasonalWorkerRMA,
  formSeasonalCountRMA,
  formWorkersCountRMA,
  handleUpdateOfficialWorkerBG,
  formOfficialCountBG,
  handleUpdateSeasonalWorkerBG,
  formSeasonalCountBG,
  formWorkersCountBG,
  formWorkersCount,
  formHourlyChartData,
  kpis,
  productionLogs,
  dailySummaries,
  setLoggingSubTab,
  loggingSubTab,
  recordsFilterDate,
  setRecordsFilterDate,
  logsDates,
  setFilterDivision,
  displayProductionLogs,
  handleEditLog,
  handleDeleteLog,
  hourlyChartData,
  displayDailySummaries,
  setFormDate,
  setFormModelItems,
  setFormMessage
}: any) => {
  return (
    <motion.div
              key="logging"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6 w-full"
            >
              
              {/* FORM ZONE */}
              <div className="w-full bg-slate-900/30 p-3 rounded-xl border border-slate-800/60 space-y-3">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <PlusCircle className="text-rose-500 w-5 h-5" />
                    Khởi tạo Nhật Ký Ca mới
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ghi nhiều model chung một ngày, cập nhật chi tiết khung giờ 1h/lần</p>
                </div>

                {formMessage && (
                  <div className={`p-3 rounded text-xs ${
                    formMessage.startsWith("✅") ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800"
                  }`}>
                    {formMessage}
                  </div>
                )}

                <form onSubmit={handleAddLog} className="space-y-3 text-xs text-slate-300">
                  
                  {/* New Excel-like Form Layout */}
                  <div className="space-y-3">
                    {/* Header Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800/80">
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-slate-400 font-mono uppercase">Ngày ghi nhận</label>
                        <input type="date" value={formDate} onChange={handleDateChange} className="w-full bg-slate-950/40 border border-slate-700/60 rounded p-1.5 text-white font-mono focus:border-rose-500 outline-none" required />
                      </div>
                      
                      {/* Hidden fields as requested */}
                      <div className="hidden">
                        <select value={formShift} onChange={(e: any) => handleShiftChange(e.target.value)}>
                          <option value="Ca HC (08:00 - 17:00)">Ca HC (08:00 - 17:00)</option>
                        </select>
                        <select value={formLineId} onChange={(e) => setFormLineId(e.target.value)}>
                          {SUNHOUSE_LINES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <select value={formTechnician} onChange={(e) => setFormTechnician(e.target.value)}>
                          <option value="Nguyễn Minh Hoàng Khiêm ( DCLR )">Nguyễn Minh Hoàng Khiêm ( DCLR )</option>
                          <option value="Nguyễn Quốc Thịnh ( DCBG )">Nguyễn Quốc Thịnh ( DCBG )</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 col-span-1">
                        <label className="text-[11px] text-emerald-400 font-mono uppercase flex items-center gap-1">
                          <PlusCircle className="w-3 h-3" /> Thêm khung giờ
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            placeholder="8H - 9H"
                            value={newSlotInput}
                            onChange={(e) => setNewSlotInput(e.target.value)}
                            className="w-full bg-slate-950/40 border border-slate-700/60 rounded p-1.5 text-white font-mono focus:border-rose-500 outline-none placeholder-slate-750 text-xs"
                          />
                          <button
                            type="button"
                            onClick={handleAddSlot}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 rounded flex items-center justify-center shrink-0 text-xs cursor-pointer"
                            title="Thêm khung giờ mới"
                          >
                            Thêm
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Máy quét mã vạch (Barcode Scanner) */}
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/80 space-y-2">
                      <label className="text-[11px] text-sky-400 font-mono uppercase flex items-center gap-1">
                        <ScanBarcode className="w-3 h-3" /> Quét mã IMEI (Tự động cộng 1 vào khung giờ hiện tại)
                      </label>
                      <div className="flex gap-2 items-center">
                        <div className="bg-slate-950/50 p-2 rounded border border-slate-800 text-sky-400 font-mono text-[10px] px-3 flex items-center gap-1.5 shrink-0 select-none">
                          <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></div>
                          TỰ ĐỘNG NHẬN DIỆN MODEL
                        </div>
                        <input
                          type="text"
                          placeholder="Đặt con trỏ chuột vào đây và quét IMEI..."
                          value={scanInput}
                          onChange={(e) => setScanInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                               e.preventDefault();
                               handleScanSubmit(e.currentTarget.value.toUpperCase());
                             }
                          }}
                          className="flex-1 bg-slate-950/40 border border-slate-700/60 rounded p-1.5 text-white font-mono focus:border-sky-500 outline-none placeholder-slate-600 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleScanSubmit(scanInput)}
                          className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-1.5 rounded flex items-center justify-center shrink-0 text-xs cursor-pointer transition-colors"
                        >
                          Ghi Nhận
                        </button>
                      </div>
                    </div>

                    {/* Matrix Input Table */}
                    <div className="overflow-x-auto border border-slate-800 rounded-lg shadow-xl shadow-slate-950">
                      <table className="matrix-table w-full text-[12px] font-mono whitespace-nowrap text-center">
                        <thead>
                          <tr className="!bg-yellow-400 text-slate-950 border-b border-slate-800 font-bold uppercase">
                            <th className="py-1 px-1 text-left sticky left-0 !bg-yellow-400 z-10 min-w-[160px] w-[160px]">Model Sản Xuất</th>
                            <th className="py-1 px-1 border-r border-yellow-500 !bg-yellow-400 min-w-[65px] w-[65px] text-center">HSQĐ</th>
                            <th className="py-1 px-1 border-r border-yellow-500 !bg-yellow-400 min-w-[95px] w-[95px] text-center">KHSX Ngày</th>
                            {formSlots.map(slot => (
                              <th key={slot} className="py-1 px-1 border-r border-yellow-500 !bg-yellow-400 relative group min-w-[80px] w-[80px] text-center">
                                <div className="flex items-center justify-center gap-0.5 flex-nowrap whitespace-nowrap text-[11px] font-bold">
                                  <span>{slot}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSlot(slot)}
                                    className="opacity-0 group-hover:opacity-100 transition text-rose-600 hover:text-rose-700 p-0.5 rounded cursor-pointer bg-white/50"
                                    title={`Xóa khung giờ ${slot}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </th>
                            ))}
                            <th className="py-1 px-1 border-r border-yellow-500 !bg-yellow-400 min-w-[85px] w-[85px] text-center">Tổng Lượng</th>
                            <th className="py-1 px-1 border-r border-yellow-500 !bg-yellow-400 min-w-[85px] w-[85px] text-center">Chênh Lệch</th>
                            <th className="py-1 px-1 border-r border-yellow-500 !bg-yellow-400 min-w-[115px] w-[115px] text-center">SL CẦN HOÀN THÀNH LSX</th>
                            <th className="py-1 px-1 text-center w-8 !bg-yellow-400">Xóa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-950/30 text-slate-200">
                          {formModelItems
                            .filter((item) => {
                              if (filterDivision === "ALL") return true;
                              const p = products.find((x) => x.id === item.productId);
                              if (!p) return true;
                              return p.group === filterDivision;
                            })
                            .map((item, idx) => {
                              const prodDef = products.find((p) => p.id === item.productId) || products[0];
                              if (!prodDef) return null;
                              const modelActual = Object.keys(item.hourlyActuals).reduce((sum, key) => sum + (item.hourlyActuals[key] || 0), 0);
                              return (
                                <tr key={`model-row-${item.id}-${idx}`} className="hover:bg-slate-900/50 transition">
                                  <td className="py-1 px-1 sticky left-0 bg-slate-950/50 z-10 text-left border-r border-slate-800 min-w-[160px] w-[160px]">
                                    <div className="flex gap-1 items-center w-full">
                                      <span className="text-slate-600 font-bold ml-1 shrink-0 select-none whitespace-nowrap">{idx + 1}.</span>
                                      <select
                                        value={item.productId}
                                        onChange={(e) => handleUpdateItem(item.id, { productId: e.target.value })}
                                        className="w-full bg-transparent border-0 text-white focus:ring-0 outline-none cursor-pointer whitespace-nowrap text-[13px] py-0.5"
                                      >
                                        {products
                                          .filter(prod => filterDivision === "ALL" || prod.group === filterDivision)
                                          .map((prod) => (
                                          <option key={prod.id} value={prod.id} className="bg-slate-900">
                                            {getProductModelCode(prod.name)}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </td>
                                  <td className="py-1 px-2 border-r border-slate-800 text-cyan-500 font-bold min-w-[65px] w-[65px] text-center">{prodDef.factor || 1}</td>
                                  <td className="p-0 border-r border-slate-800 min-w-[95px] w-[95px]">
                                    <input
                                      type="number"
                                      min={0}
                                      value={item.dailyPlan !== undefined && !Number.isNaN(item.dailyPlan) ? item.dailyPlan : ""}
                                      onChange={(e) => handleUpdateItem(item.id, { dailyPlan: parseInt(e.target.value) || 0 })}
                                      className="w-full h-full min-h-[30px] bg-transparent text-center focus:bg-slate-900 focus:outline-none font-bold text-amber-400 placeholder-slate-700 text-[13px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      placeholder="0"
                                    />
                                  </td>
                                  {formSlots.map(slot => (
                                    <td key={slot} className="p-0 border-r border-slate-800 min-w-[80px] w-[80px]">
                                      <input
                                        type="number"
                                        min={0}
                                        value={item.hourlyActuals[slot] !== undefined && !Number.isNaN(item.hourlyActuals[slot]) ? item.hourlyActuals[slot] : ""}
                                        onChange={(e) => handleUpdateItemHourly(item.id, slot, parseInt(e.target.value) || 0)}
                                        className="w-full h-full min-h-[30px] bg-transparent text-center focus:bg-slate-900 focus:outline-none font-bold text-white placeholder-slate-700 text-[13px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="-"
                                      />
                                    </td>
                                  ))}
                                  <td className="py-1 px-2 font-bold text-emerald-400 border-r border-slate-800 bg-slate-900/30 min-w-[85px] w-[85px] text-center">{modelActual || 0}</td>
                                  <td className={`py-1 px-2 font-bold border-r border-slate-800 bg-slate-900/30 text-center min-w-[85px] w-[85px] ${
                                    modelActual - (item.dailyPlan || 0) >= 0 ? "text-emerald-400" : "text-rose-500"
                                  }`}>
                                    {modelActual - (item.dailyPlan || 0) > 0 ? `+${modelActual - (item.dailyPlan || 0)}` : modelActual - (item.dailyPlan || 0)}
                                  </td>
                                  <td className="py-1 px-2 font-bold text-sky-400 border-r border-slate-800 bg-slate-900/30 text-center min-w-[115px] w-[115px]">
                                    {Math.max(0, (item.dailyPlan || 0) + (getPrevDayLeftover(item.productId, formDate) || 0) - (modelActual || 0))}
                                  </td>
                                  <td className="py-1 px-2">
                                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-rose-500 hover:text-rose-400 transition" disabled={formModelItems.length === 1}>
                                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}

                          {/* 2. Add Row Button */}
                          <tr key="add-row-btn">
                            <td colSpan={formSlots.length + 7} className="py-1 px-1 text-left bg-slate-900/30">
                              <button type="button" onClick={handleAddNewItem} className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 hover:text-emerald-400">
                                <PlusCircle className="w-3 h-3" /> Thêm Model
                              </button>
                            </td>
                          </tr>

                          {/* 3. Metrics Summary Rows */}
                          {/* Total Qty */}
                          <tr key="total-qty-row" className="bg-white font-bold text-blue-700 border-t-2 border-slate-300">
                            <td colSpan={3} className="py-1 px-1 text-right border-r border-slate-300 sticky left-0 bg-white z-10 text-blue-700">
                              Tổng sản lượng (Cái)
                            </td>
                            {formSlots.map(slot => {
                              const sum = formModelItems
                                .filter(item => filterDivision === "ALL" || (products.find(x => x.id === item.productId) || products[0]).group === filterDivision)
                                .reduce((acc, item) => acc + (item.hourlyActuals[slot] || 0), 0);
                              return <td key={slot} className="py-1 px-1 border-r border-slate-300 text-blue-700 min-w-[80px] w-[80px] text-center">{sum || 0}</td>
                            })}
                            <td className="py-1 px-1 border-r border-slate-300 text-blue-700 font-bold text-center">{displayTotalActualQty || 0}</td>
                            <td className={`py-1 px-1 border-r border-slate-300 font-bold text-center ${
                              displayTotalActualQty - displayTotalPlanQty >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}>
                              {displayTotalActualQty - displayTotalPlanQty > 0 
                                ? `+${displayTotalActualQty - displayTotalPlanQty}` 
                                : displayTotalActualQty - displayTotalPlanQty}
                            </td>
                            <td className="py-1 px-1 border-r border-slate-300 text-blue-700 font-bold text-center">
                              {displayTotalRemainingQty}
                            </td>
                            <td></td>
                          </tr>

                          {/* Equivalent Qty */}
                          <tr key="equivalent-qty-row" className="bg-white font-bold text-blue-700">
                            <td colSpan={3} className="py-1 px-1 text-right border-r border-slate-300 sticky left-0 bg-white z-10 whitespace-nowrap text-blue-700">
                              Sản phẩm quy đổi (SP)
                            </td>
                            {formSlots.map(slot => {
                              let sumEq = 0;
                              formModelItems
                                .filter(item => filterDivision === "ALL" || (products.find(x => x.id === item.productId) || products[0]).group === filterDivision)
                                .forEach(item => {
                                const p = products.find(x => x.id === item.productId) || products[0];
                                sumEq += Math.round((item.hourlyActuals[slot] || 0) * p.factor);
                              });
                              return <td key={slot} className="py-1 px-1 border-r border-slate-300 min-w-[80px] w-[80px] text-center text-blue-700">{sumEq || 0}</td>
                            })}
                            <td className="py-1 px-1 border-r border-slate-300 text-blue-700 text-center">{displayTotalEqQty || 0}</td>
                            <td className="py-1 px-1 border-r border-slate-300 text-blue-700 text-center">-</td>
                            <td className="py-1 px-1 border-r border-slate-300 text-blue-700 text-center">-</td>
                            <td></td>
                          </tr>

                          {/* Tỷ lệ hoàn thành KHSX (%) */}
                          <tr key="completion-rate-row" className="bg-white font-bold border-t border-slate-300 text-blue-700">
                            <td colSpan={3} className="py-1 px-1 text-right border-r border-slate-300 sticky left-0 bg-white z-10 text-blue-700 whitespace-nowrap">
                              Tỷ lệ hoàn thành KHSX (%)
                            </td>
                            {formSlots.map(slot => {
                              const sumActual = formModelItems
                                .filter(item => filterDivision === "ALL" || (products.find(x => x.id === item.productId) || products[0]).group === filterDivision)
                                .reduce((acc, item) => acc + (item.hourlyActuals[slot] || 0), 0);
                              const hourlyPlan = displayTotalPlanQty / (formSlots.length || 1);
                              let rate = 0;
                              if (hourlyPlan > 0) {
                                rate = Number(((sumActual / hourlyPlan) * 100).toFixed(1));
                              }
                              return (
                                <td key={slot} className={`py-1 px-1 border-r border-slate-800 min-w-[80px] w-[80px] text-center ${rate >= 100 ? "text-emerald-400" : rate > 0 ? "text-amber-400" : "text-rose-400"}`}>
                                  {displayTotalPlanQty > 0 ? `${rate}%` : "-"}
                                </td>
                              )
                            })}
                            <td className="py-1 px-1 border-r border-slate-800 text-amber-400">
                              {displayTotalPlanQty > 0 
                                ? `${((displayTotalActualQty / displayTotalPlanQty) * 100).toFixed(1)}%` 
                                : "-"}
                            </td>
                            <td className="py-1 px-1 border-r border-slate-300 text-blue-700 text-center">-</td>
                            <td className="py-1 px-1 border-r border-slate-300 text-blue-700 text-center">-</td>
                            <td></td>
                          </tr>

                          {/* Productivity RO % */}
                          {(filterDivision === "ALL" || filterDivision === "MLN") && (
                            <tr key="productivity-ro-row" className="prod-row-ro font-bold bg-emerald-950/30 border-t border-slate-300 text-emerald-400 text-[14px]">
                              <td colSpan={3} className="py-1 px-1 text-right border-r border-slate-300 sticky left-0 prod-row-ro bg-emerald-950/90 z-10 whitespace-nowrap">
                                NSLĐ DCRO (%)
                              </td>
                              {formSlots.map(slot => {
                                let sumEqRO = 0;
                                formModelItems.forEach(item => {
                                  const p = products.find(x => x.id === item.productId) || products[0];
        if (!p) return;
        if (p.group === "MLN") {
                                    sumEqRO += Math.round((item.hourlyActuals[slot] || 0) * p.factor);
                                  }
                                });
                                const workersRO = (formOfficialWorkersRO[slot] || 0) + (formSeasonalWorkersRO[slot] || 0);
                                let prodPct = 0;
                                if (workersRO > 0) {
                                  prodPct = Number(((sumEqRO / (workersRO * (INDUSTRIAL_STANDARDS.standardQtyPerManday / 8))) * 100).toFixed(1));
                                }
                                return (
                                  <td key={slot} className="py-1 px-1 border-r border-slate-300 min-w-[80px] w-[80px] text-center text-emerald-700">
                                    {prodPct > 0 ? `${prodPct}%` : "-"}
                                  </td>
                                )
                              })}
                              <td className="py-1 px-1 border-r border-slate-300 font-bold text-center">{(formAggregates.avgProductivityRO || 0).toFixed(1)}%</td>
                              <td className="py-1 px-1 border-r border-slate-300 text-emerald-700 text-center">-</td>
                              <td className="py-1 px-1 border-r border-slate-300 text-emerald-700 text-center">-</td>
                              <td></td>
                            </tr>
                          )}

                          {/* Productivity RMA % */}
                          {(filterDivision === "ALL" || filterDivision === "MLN" || filterDivision === "RMA") && (
                            <tr key="productivity-rma-row" className="prod-row-rma font-bold bg-amber-950/30 border-t border-slate-300 text-amber-400 text-[14px]">
                              <td colSpan={3} className="py-1 px-1 text-right border-r border-slate-300 sticky left-0 prod-row-rma bg-amber-950/90 z-10 whitespace-nowrap">
                                NSLĐ DCRMA (%)
                              </td>
                              {formSlots.map(slot => {
                                let sumEqRMA = 0;
                                formModelItems.forEach(item => {
                                  const p = products.find(x => x.id === item.productId) || products[0];
                                  if (!p) return;
                                  const isRMA = p.group === "RMA" || 
                                                (p.group === "MLN" && (
                                                  p.name.toLowerCase().includes("rma") || 
                                                  p.code.toLowerCase().includes("rma") || 
                                                  p.id.toLowerCase().includes("rma")
                                                ));
                                  if (isRMA) {
                                    sumEqRMA += Math.round((item.hourlyActuals[slot] || 0) * p.factor);
                                  }
                                });
                                const workersRMA = (formOfficialWorkersRMA[slot] || 0) + (formSeasonalWorkersRMA[slot] || 0);
                                let prodPct = 0;
                                if (workersRMA > 0) {
                                  prodPct = Number(((sumEqRMA / (workersRMA * (INDUSTRIAL_STANDARDS.standardQtyPerManday / 8))) * 100).toFixed(1));
                                }
                                return (
                                  <td key={slot} className="py-1 px-1 border-r border-slate-300 min-w-[80px] w-[80px] text-center text-amber-700">
                                    {prodPct > 0 ? `${prodPct}%` : "-"}
                                  </td>
                                )
                              })}
                              <td className="py-1 px-1 border-r border-slate-300 font-bold text-center">{(formAggregates.avgProductivityRMA || 0).toFixed(1)}%</td>
                              <td className="py-1 px-1 border-r border-slate-300 text-amber-700 text-center">-</td>
                              <td className="py-1 px-1 border-r border-slate-300 text-amber-700 text-center">-</td>
                              <td></td>
                            </tr>
                          )}

                          {/* Productivity BG % */}
                          {(filterDivision === "ALL" || filterDivision === "BG") && (
                            <tr key="productivity-bg-row" className="prod-row-bg font-bold bg-sky-950/30 border-t border-slate-300 text-sky-400 text-[14px]">
                              <td colSpan={3} className="py-1 px-1 text-right border-r border-slate-300 sticky left-0 prod-row-bg bg-sky-950/90 z-10 whitespace-nowrap">
                                NSLĐ DCBG (%)
                              </td>
                              {formSlots.map(slot => {
                                let sumEqBG = 0;
                                formModelItems.forEach(item => {
                                  const p = products.find(x => x.id === item.productId) || products[0];
                                  if (p.group === "BG") {
                                    sumEqBG += Math.round((item.hourlyActuals[slot] || 0) * p.factor);
                                  }
                                });
                                const workersBG = (formOfficialWorkersBG[slot] || 0) + (formSeasonalWorkersBG[slot] || 0);
                                let prodPct = 0;
                                if (workersBG > 0) {
                                  prodPct = Number(((sumEqBG / (workersBG * (INDUSTRIAL_STANDARDS.standardQtyPerManday / 8))) * 100).toFixed(1));
                                }
                                return (
                                  <td key={slot} className="py-1 px-1 border-r border-slate-300 min-w-[80px] w-[80px] text-center text-sky-700">
                                    {prodPct > 0 ? `${prodPct}%` : "-"}
                                  </td>
                                )
                              })}
                              <td className="py-1 px-1 border-r border-slate-300 font-bold text-center">{(formAggregates.avgProductivityBG || 0).toFixed(1)}%</td>
                              <td className="py-1 px-1 border-r border-slate-300 text-sky-700 text-center">-</td>
                              <td className="py-1 px-1 border-r border-slate-300 text-sky-700 text-center">-</td>
                              <td></td>
                            </tr>
                          )}

                          {/* Combined Productivity % */}
                          {filterDivision === "ALL" && (
                            <tr key="productivity-combined-row" className="prod-row-lr font-black bg-rose-950/30 text-rose-400 border-t border-slate-300 text-[15px]">
                              <td colSpan={3} className="py-2 px-1 text-right border-r border-slate-300 sticky left-0 prod-row-lr bg-rose-950/90 z-10 whitespace-nowrap uppercase tracking-wide">
                                NSLĐ Phân Xưởng LR (%)
                              </td>
                              {formSlots.map(slot => {
                                let sumEqCombined = 0;
                                formModelItems.forEach(item => {
                                  const p = products.find(x => x.id === item.productId) || products[0];
                                  sumEqCombined += Math.round((item.hourlyActuals[slot] || 0) * p.factor);
                                });
                                const workersCombined = (formOfficialWorkersRO[slot] || 0) + (formSeasonalWorkersRO[slot] || 0) + (formOfficialWorkersBG[slot] || 0) + (formSeasonalWorkersBG[slot] || 0) + (formOfficialWorkersRMA[slot] || 0) + (formSeasonalWorkersRMA[slot] || 0);
                                let prodPct = 0;
                                if (workersCombined > 0) {
                                  prodPct = Number(((sumEqCombined / (workersCombined * (INDUSTRIAL_STANDARDS.standardQtyPerManday / 8))) * 100).toFixed(1));
                                }
                                return (
                                  <td key={slot} className="py-2 px-1 border-r border-slate-300 min-w-[80px] w-[80px] text-center text-rose-700">
                                    {prodPct > 0 ? `${prodPct}%` : "-"}
                                  </td>
                                )
                              })}
                              <td className="py-2 px-1 border-r border-slate-300 text-center">{(formAggregates.avgProductivity || 0).toFixed(1)}%</td>
                              <td className="py-2 px-1 border-r border-slate-300 text-rose-700 text-center">-</td>
                              <td className="py-2 px-1 border-r border-slate-300 text-rose-700 text-center">-</td>
                              <td className="bg-slate-700/80"></td>
                            </tr>
                          )}

                          {/* Spacer */}
                          <tr key="spacer-1" className="h-2 bg-slate-950">
                            <td colSpan={formSlots.length + 7}></td>
                          </tr>

                          {/* --- worker tracking: LINE RO --- */}
                          {(filterDivision === "ALL" || filterDivision === "MLN") && (
                            <React.Fragment key="worker-tracking-ro">
                              <tr key="ro-header" className="bg-emerald-950/20 border-t border-emerald-900/50">
                                <td colSpan={3} className="py-1 px-1 text-left pl-2 text-emerald-400 font-bold border-r border-slate-800 sticky left-0 bg-slate-950 z-10 whitespace-nowrap">
                                  📍 DÂY CHUYỀN LẮP RÁP RO (DCRO)
                                </td>
                                <td colSpan={formSlots.length + 4}></td>
                              </tr>

                              <tr key="ro-official-workers" className="bg-slate-900/40">
                                <td colSpan={3} className="py-0.5 px-2 text-right text-rose-300 font-bold border-r border-slate-800 sticky left-0 bg-slate-900/40 z-10 pl-4 whitespace-nowrap">
                                  ↳ NS CHÍNH THỨC RO
                                </td>
                                {formSlots.map(slot => (
                                  <td key={slot} className="p-0 border-r border-slate-800 min-w-[80px] w-[80px]">
                                    <input
                                      type="number"
                                      min={0}
                                      value={formOfficialWorkersRO[slot] !== undefined && !Number.isNaN(formOfficialWorkersRO[slot]) ? formOfficialWorkersRO[slot] : ""}
                                      onChange={(e) => handleUpdateOfficialWorkerRO(slot, parseInt(e.target.value) || 0)}
                                      className="w-full h-full min-h-[30px] bg-transparent text-center text-rose-300 font-bold focus:bg-slate-800 focus:outline-none text-[13px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </td>
                                ))}
                                <td className="border-r border-slate-800 text-rose-300 font-bold text-center">{formOfficialCountRO || 0}</td>
                                <td className="border-r border-slate-800"></td>
                                <td className="border-r border-slate-800"></td>
                                <td></td>
                              </tr>

                              <tr key="ro-seasonal-workers" className="bg-slate-900/40">
                                <td colSpan={3} className="py-0.5 px-2 text-right text-amber-300 font-bold border-r border-slate-800 sticky left-0 bg-slate-900/40 z-10 pl-4 whitespace-nowrap">
                                  ↳ NS THỜI VỤ RO
                                </td>
                                {formSlots.map(slot => (
                                  <td key={slot} className="p-0 border-r border-slate-800 min-w-[80px] w-[80px]">
                                    <input
                                      type="number"
                                      min={0}
                                      value={formSeasonalWorkersRO[slot] !== undefined && !Number.isNaN(formSeasonalWorkersRO[slot]) ? formSeasonalWorkersRO[slot] : ""}
                                      onChange={(e) => handleUpdateSeasonalWorkerRO(slot, parseInt(e.target.value) || 0)}
                                      className="w-full h-full min-h-[30px] bg-transparent text-center text-amber-300 font-bold focus:bg-slate-800 focus:outline-none text-[13px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </td>
                                ))}
                                <td className="border-r border-slate-800 text-amber-300 font-bold text-center">{formSeasonalCountRO || 0}</td>
                                <td className="border-r border-slate-800"></td>
                                <td className="border-r border-slate-800"></td>
                                <td></td>
                              </tr>

                              <tr key="ro-total-workers" className="bg-emerald-950/30 text-[14px] total-row-ro">
                                <td colSpan={3} className="py-2 px-2 text-right text-emerald-400 font-bold border-r border-slate-800 sticky left-0 bg-emerald-950/90 z-10 pl-4 whitespace-nowrap">
                                  ↳ Tổng nhân sự DCRO
                                </td>
                                {formSlots.map(slot => (
                                  <td key={slot} className="py-2 px-1 border-r border-slate-800 text-emerald-400 font-bold min-w-[80px] w-[80px] text-center">
                                    {(formOfficialWorkersRO[slot] || 0) + (formSeasonalWorkersRO[slot] || 0)}
                                  </td>
                                ))}
                                <td className="py-2 px-1 border-r border-slate-800 text-emerald-400 font-bold text-center">
                                  {formWorkersCountRO}
                                </td>
                                <td className="border-r border-slate-800"></td>
                                <td className="border-r border-slate-800"></td>
                                <td></td>
                              </tr>

                              {/* Spacer */}
                              <tr key="ro-spacer" className="h-2 bg-slate-950">
                                <td colSpan={formSlots.length + 7}></td>
                              </tr>

                              {/* --- worker tracking: LINE RMA --- */}
                              <tr key="rma-header" className="bg-amber-950/20 border-t border-amber-900/50">
                                <td colSpan={3} className="py-1 px-1 text-left pl-2 text-amber-400 font-bold border-r border-slate-800 sticky left-0 bg-slate-950 z-10 whitespace-nowrap">
                                  📍 DÂY CHUYỀN LẮP RÁP RMA (RW)
                                </td>
                                <td colSpan={formSlots.length + 4}></td>
                              </tr>

                              <tr key="rma-official-workers" className="bg-slate-900/40">
                                <td colSpan={3} className="py-0.5 px-2 text-right text-rose-300 font-bold border-r border-slate-800 sticky left-0 bg-slate-900/40 z-10 pl-4 whitespace-nowrap">
                                  ↳ NS CHÍNH THỨC RMA
                                </td>
                                {formSlots.map(slot => (
                                  <td key={slot} className="p-0 border-r border-slate-800 min-w-[80px] w-[80px]">
                                    <input
                                      type="number"
                                      min={0}
                                      value={formOfficialWorkersRMA[slot] !== undefined && !Number.isNaN(formOfficialWorkersRMA[slot]) ? formOfficialWorkersRMA[slot] : ""}
                                      onChange={(e) => handleUpdateOfficialWorkerRMA(slot, parseInt(e.target.value) || 0)}
                                      className="w-full h-full min-h-[30px] bg-transparent text-center text-rose-300 font-bold focus:bg-slate-800 focus:outline-none text-[13px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </td>
                                ))}
                                <td className="border-r border-slate-800 text-rose-300 font-bold text-center">{formOfficialCountRMA || 0}</td>
                                <td className="border-r border-slate-800"></td>
                                <td className="border-r border-slate-800"></td>
                                <td></td>
                              </tr>

                              <tr key="rma-seasonal-workers" className="bg-slate-900/40">
                                <td colSpan={3} className="py-0.5 px-2 text-right text-amber-300 font-bold border-r border-slate-800 sticky left-0 bg-slate-900/40 z-10 pl-4 whitespace-nowrap">
                                  ↳ NS THỜI VỤ RMA
                                </td>
                                {formSlots.map(slot => (
                                  <td key={slot} className="p-0 border-r border-slate-800 min-w-[80px] w-[80px]">
                                    <input
                                      type="number"
                                      min={0}
                                      value={formSeasonalWorkersRMA[slot] !== undefined && !Number.isNaN(formSeasonalWorkersRMA[slot]) ? formSeasonalWorkersRMA[slot] : ""}
                                      onChange={(e) => handleUpdateSeasonalWorkerRMA(slot, parseInt(e.target.value) || 0)}
                                      className="w-full h-full min-h-[30px] bg-transparent text-center text-amber-300 font-bold focus:bg-slate-800 focus:outline-none text-[13px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </td>
                                ))}
                                <td className="border-r border-slate-800 text-amber-300 font-bold text-center">{formSeasonalCountRMA || 0}</td>
                                <td className="border-r border-slate-800"></td>
                                <td className="border-r border-slate-800"></td>
                                <td></td>
                              </tr>

                              <tr key="rma-total-workers" className="bg-amber-950/30 text-[14px] total-row-rma">
                                <td colSpan={3} className="py-2 px-2 text-right text-amber-400 font-bold border-r border-slate-800 sticky left-0 bg-amber-950/90 z-10 pl-4 whitespace-nowrap">
                                  ↳ Tổng nhân sự DCRMA
                                </td>
                                {formSlots.map(slot => (
                                  <td key={slot} className="py-2 px-1 border-r border-slate-800 text-amber-400 font-bold min-w-[80px] w-[80px] text-center">
                                    {(formOfficialWorkersRMA[slot] || 0) + (formSeasonalWorkersRMA[slot] || 0)}
                                  </td>
                                ))}
                                <td className="py-2 px-1 border-r border-slate-800 text-amber-400 font-bold text-center">
                                  {formWorkersCountRMA}
                                </td>
                                <td className="border-r border-slate-800"></td>
                                <td className="border-r border-slate-800"></td>
                                <td></td>
                              </tr>

                              <tr key="rma-spacer" className="h-2 bg-slate-950">
                                <td colSpan={formSlots.length + 7}></td>
                              </tr>
                            </React.Fragment>
                          )}

                          {/* --- worker tracking: LINE BG --- */}
                          {(filterDivision === "ALL" || filterDivision === "BG") && (
                            <React.Fragment key="worker-tracking-bg">
                              <tr key="bg-header" className="bg-sky-950/20 border-t border-sky-900/50">
                                <td colSpan={3} className="py-1 px-1 text-left pl-2 text-sky-400 font-bold border-r border-slate-800 sticky left-0 bg-slate-950 z-10 whitespace-nowrap">
                                  📍 DÂY CHUYỀN LẮP RÁP BẾP GAS (DCBG)
                                </td>
                                <td colSpan={formSlots.length + 4}></td>
                              </tr>

                              <tr key="bg-official-workers" className="bg-slate-900/40">
                                <td colSpan={3} className="py-0.5 px-2 text-right text-rose-300 font-bold border-r border-slate-800 sticky left-0 bg-slate-900/40 z-10 pl-4 whitespace-nowrap">
                                  ↳ NS CHÍNH THỨC BG
                                </td>
                                {formSlots.map(slot => (
                                  <td key={slot} className="p-0 border-r border-slate-800 min-w-[80px] w-[80px]">
                                    <input
                                      type="number"
                                      min={0}
                                      value={formOfficialWorkersBG[slot] !== undefined && !Number.isNaN(formOfficialWorkersBG[slot]) ? formOfficialWorkersBG[slot] : ""}
                                      onChange={(e) => handleUpdateOfficialWorkerBG(slot, parseInt(e.target.value) || 0)}
                                      className="w-full h-full min-h-[30px] bg-transparent text-center text-rose-300 font-bold focus:bg-slate-800 focus:outline-none text-[13px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </td>
                                ))}
                                <td className="border-r border-slate-800 text-rose-300 font-bold text-center">{formOfficialCountBG || 0}</td>
                                <td className="border-r border-slate-800"></td>
                                <td className="border-r border-slate-800"></td>
                                <td></td>
                              </tr>

                              <tr key="bg-seasonal-workers" className="bg-slate-900/40">
                                <td colSpan={3} className="py-0.5 px-2 text-right text-amber-300 font-bold border-r border-slate-800 sticky left-0 bg-slate-900/40 z-10 pl-4 whitespace-nowrap">
                                  ↳ NS THỜI VỤ BG
                                </td>
                                {formSlots.map(slot => (
                                  <td key={slot} className="p-0 border-r border-slate-800 min-w-[80px] w-[80px]">
                                    <input
                                      type="number"
                                      min={0}
                                      value={formSeasonalWorkersBG[slot] !== undefined && !Number.isNaN(formSeasonalWorkersBG[slot]) ? formSeasonalWorkersBG[slot] : ""}
                                      onChange={(e) => handleUpdateSeasonalWorkerBG(slot, parseInt(e.target.value) || 0)}
                                      className="w-full h-full min-h-[30px] bg-transparent text-center text-amber-300 font-bold focus:bg-slate-800 focus:outline-none text-[13px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </td>
                                ))}
                                <td className="border-r border-slate-800 text-amber-300 font-bold text-center">{formSeasonalCountBG || 0}</td>
                                <td className="border-r border-slate-800"></td>
                                <td className="border-r border-slate-800"></td>
                                <td></td>
                              </tr>

                              <tr key="bg-total-workers" className="bg-sky-950/30 text-[14px] total-row-bg">
                                <td colSpan={3} className="py-2 px-2 text-right text-sky-400 font-bold border-r border-slate-800 sticky left-0 bg-sky-950/90 z-10 pl-4 whitespace-nowrap">
                                  ↳ Tổng nhân sự DCBG
                                </td>
                                {formSlots.map(slot => (
                                  <td key={slot} className="py-2 px-1 border-r border-slate-800 text-sky-400 font-bold min-w-[80px] w-[80px] text-center">
                                    {(formOfficialWorkersBG[slot] || 0) + (formSeasonalWorkersBG[slot] || 0)}
                                  </td>
                                ))}
                                <td className="py-2 px-1 border-r border-slate-800 text-sky-400 font-bold text-center">
                                  {formWorkersCountBG}
                                </td>
                                <td className="border-r border-slate-800"></td>
                                <td className="border-r border-slate-800"></td>
                                <td></td>
                              </tr>

                              {/* Spacer */}
                              <tr key="bg-spacer" className="h-2 bg-slate-950">
                                <td colSpan={formSlots.length + 7}></td>
                              </tr>
                            </React.Fragment>
                          )}

                          {/* Combined Grand Total Workers */}
                          {filterDivision === "ALL" && (
                            <tr key="grand-total-workers" className="bg-[#92D050] border-t border-green-600 text-slate-950 font-black text-[15px]">
                              <td colSpan={3} className="py-2 px-1 text-right border-r border-green-600 sticky left-0 bg-[#92D050] z-10 whitespace-nowrap uppercase tracking-wide">
                                Tổng công các Dây chuyền
                              </td>
                              {formSlots.map(slot => {
                                const totalH = (formOfficialWorkersRO[slot] || 0) + (formSeasonalWorkersRO[slot] || 0) + (formOfficialWorkersRMA[slot] || 0) + (formSeasonalWorkersRMA[slot] || 0) + (formOfficialWorkersBG[slot] || 0) + (formSeasonalWorkersBG[slot] || 0);
                                return (
                                  <td key={slot} className="py-2 px-1 border-r border-green-600 min-w-[80px] w-[80px] text-center">
                                    {totalH}
                                  </td>
                                );
                              })}
                              <td className="py-2 px-1 border-r border-green-600 text-center">
                                {formWorkersCount}
                              </td>
                              <td className="border-r border-green-600"></td>
                              <td className="border-r border-green-600"></td>
                              <td className="bg-slate-700/80"></td>
                            </tr>
                          )}
                          
                        </tbody>
                      </table>
                    </div>

                    {/* Hourly Productivity Chart */}
                    {formSlots.length > 0 && (
                      <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/30">
                        <h4 className="text-[11px] font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-rose-500" />
                          Biểu đồ NSLĐ từng khung giờ
                        </h4>
                        <div className="h-[360px] w-full mt-2">
                          <ResponsiveContainer width="99%" height="100%">
                            <ComposedChart data={formHourlyChartData} margin={{ top: 75, right: 10, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                              <XAxis dataKey="slot" stroke="#64748b" fontSize={12} tickMargin={5} />
                              <YAxis domain={YAXIS_DOMAIN} tickFormatter={(val) => `${val}%`} stroke="#64748b" fontSize={12} />
                              <Tooltip
                                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px" }}
                                itemStyle={{ fontSize: "13px" }}
                                labelStyle={{ color: "#94a3b8", fontSize: "13px", marginBottom: "4px" }}
                                formatter={(value: any, name: any) => [`${value}%`, name]}
                                cursor={{ fill: '#1e293b', opacity: 0.4 }}
                              />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                              <ReferenceLine y={kpis.monthTarget} stroke="#10b981" strokeDasharray="3 3" />
                              <Bar isAnimationActive={false} dataKey="DCRO" name="NSLĐ DCRO" fill="#10b981" radius={[2, 2, 0, 0]}>
                                <LabelList dataKey="DCRO" position="top" offset={5} fill="#10b981" fontSize={12} fontWeight="semibold" formatter={(v: number) => v > 0 ? `${v}%` : ''} />
                              </Bar>
                              <Bar isAnimationActive={false} dataKey="DCRMA" name="NSLĐ DCRMA" fill="#f59e0b" radius={[2, 2, 0, 0]}>
                                <LabelList dataKey="DCRMA" position="top" offset={22} fill="#f59e0b" fontSize={12} fontWeight="semibold" formatter={(v: number) => v > 0 ? `${v}%` : ''} />
                              </Bar>
                              <Bar isAnimationActive={false} dataKey="DCBG" name="NSLĐ DCBG" fill="#0ea5e9" radius={[2, 2, 0, 0]}>
                                <LabelList dataKey="DCBG" position="top" offset={39} fill="#0ea5e9" fontSize={12} fontWeight="semibold" formatter={(v: number) => v > 0 ? `${v}%` : ''} />
                              </Bar>
                              <Line isAnimationActive={false} type="monotone" dataKey="DCLR" name="NSLĐ Phân Xưởng LR" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4, fill: "#f43f5e" }} activeDot={{ r: 6 }}>
                                <LabelList dataKey="DCLR" position="top" fill="#f43f5e" fontSize={13} fontWeight="bold" formatter={(v: number) => v > 0 ? `${v}%` : ''} offset={56} />
                              </Line>
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition duration-200 flex items-center justify-center gap-2 cursor-pointer text-[12px] uppercase tracking-wider shadow-lg shadow-rose-900/30"
                      >
                        <PlusCircle className="w-4 h-4" /> Lưu Nhật Ký Ca
                      </button>
                    </div>

                  </div>
                </form>
              </div>


              {/* LIVE DATABASE TABLE LOG DISPLAY LIST */}
              <div className="w-full bg-slate-900/30 p-5 rounded-xl border border-slate-800/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      <Database className="text-rose-500 w-5 h-5" />
                      Lăng kính Dữ liệu MES & Báo cáo Ca
                    </h3>
                    <p className="text-xs text-slate-400">Xem vết dữ liệu, truy xuất báo cáo theo giờ hoặc tổng hợp gọn theo ngày</p>
                  </div>

                  <span className="text-[11px] font-mono text-sky-400 border border-slate-800 px-2 py-1 rounded bg-slate-900">
                    Quy mô: <span className="font-bold">{productionLogs.length} bản ghi</span> | <span className="font-bold text-rose-455">{dailySummaries.length} ngày</span>
                  </span>
                </div>

                {/* SUB-TABS SELECTOR & LOCAL DIVISION FILTER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/30 p-2 rounded-lg border border-slate-850/60">
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setLoggingSubTab("records")}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                        loggingSubTab === "records"
                          ? "bg-rose-600 font-bold text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      📝 Chi tiết Nhật ký Ca
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoggingSubTab("hourly")}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                        loggingSubTab === "hourly"
                          ? "bg-rose-600 font-bold text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      ⏰ Báo cáo Khung giờ (1h)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoggingSubTab("daily")}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                        loggingSubTab === "daily"
                          ? "bg-rose-600 font-bold text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      📅 Tổng hợp theo Ngày
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Local Date Selector for Logs */}
                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1 px-2">
                      <span className="text-[10px] text-slate-500 font-mono uppercase">Lọc ngày:</span>
                      <select
                        value={recordsFilterDate}
                        onChange={(e) => setRecordsFilterDate(e.target.value)}
                        className="bg-transparent border-none text-[11px] font-semibold text-slate-300 focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="ALL" className="bg-slate-950">🗓️ Tất cả ngày</option>
                        {logsDates.map((d) => (
                          <option key={d} value={d} className="bg-slate-950 text-white">
                            📅 {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Local Division Selector for Logs */}
                    <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                      <span className="text-xs text-slate-400 font-black uppercase pl-2 pr-1 hidden sm:inline">Lọc tổ:</span>
                      {(["ALL", "MLN", "RMA", "BG"] as const).map(div => (
                          <button
                            key={div}
                            type="button"
                            onClick={() => setFilterDivision(div)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                              filterDivision === div ? "bg-rose-600 text-white font-bold" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            {div === "ALL" ? "Tất cả" : div === "MLN" ? "DCRO" : div === "RMA" ? "DCRMA (RMA)" : "DCBG"}
                          </button>
                      ))}
                    </div>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {loggingSubTab === "records" && (
                    <motion.div
                      key="records-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4"
                    >
                      <div className="overflow-x-auto overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-mono text-[10px]">
                              <th className="py-2.5 px-3">Ngày/Ca</th>
                              <th className="py-2.5 px-3">Dây chuyền</th>
                              <th className="py-2.5 px-3">Chi tiết Sản phẩm</th>
                              <th className="py-2.5 px-3 text-right">Lắp thực đạt</th>
                              <th className="py-2.5 px-3 text-right">Hệ số</th>
                              <th className="py-2.5 px-3 text-right">Quy đổi (SP)</th>
                              <th className="py-2.5 px-3 text-right">Công</th>
                              <th className="py-2.5 px-3 text-center">Năng suất hiếu quả</th>
                              <th className="py-2.5 px-3 text-center">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {productionLogs.length === 0 ? (
                              <tr key="empty-logs">
                                <td colSpan={9} className="py-8 text-center text-slate-500 font-sans italic">
                                  Không có dữ liệu nhật ký ca nào. Hãy điền form bên trái để ghi nhận mới!
                                </td>
                              </tr>
                            ) : displayProductionLogs.length === 0 ? (
                              <tr key="filtered-empty-logs">
                                <td colSpan={9} className="py-8 text-center text-slate-500 font-sans italic">
                                  Không tìm thấy dữ liệu nhật ký ca khớp với bộ lọc ngày hoặc tổ sản xuất.
                                </td>
                              </tr>
                            ) : (
                              displayProductionLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-900 transition text-slate-300">
                                  <td className="py-3 px-3">
                                    <div className="font-medium text-white">{log.date}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">{log.shift}</div>
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="font-semibold text-slate-200 block">{log.lineName}</span>
                                    <span className="text-[10px] text-slate-500 block">SUNHOUSE Binh Duong</span>
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="font-medium text-slate-400 block text-[11px]">{log.productName}</span>
                                    {log.hourlyActuals && (
                                      <div className="flex flex-wrap gap-1 mt-1 max-w-[280px]">
                                        {Object.keys(log.hourlyActuals).map((slot) => {
                                          const val = log.hourlyActuals?.[slot];
                                          const startHr = slot.split(" ")[0] || slot;
                                          return (
                                            <span key={slot} className="text-[9px] bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800 text-slate-450 font-mono" title={slot}>
                                              {startHr}: <span className="text-sky-400 font-extrabold">{val}</span>
                                            </span>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-right font-mono font-medium text-white">{log.actualUnits || 0}</td>
                                  <td className="py-3 px-3 text-right font-mono text-cyan-500 font-bold">x{log.equivalentFactor || 0}</td>
                                  <td className="py-3 px-3 text-right font-mono font-bold text-white">{log.equivalentProducts || 0}</td>
                                  <td className="py-3 px-3 text-right font-mono">{log.workersCount || 0}</td>
                                  <td className="py-3 px-3 text-center">
                                    <span className={`inline-block font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                      Number(log.laborProductivityPercent) >= kpis.monthTarget
                                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                        : "bg-amber-950 text-amber-400 border border-amber-800"
                                    }`}>
                                      {(Number(log.laborProductivityPercent) || 0).toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleEditLog(log.date, log.shift)}
                                        className="p-1 text-slate-400 hover:text-cyan-500 rounded hover:bg-sky-950 bg-transparent border border-transparent transition cursor-pointer"
                                        title="Chỉnh sửa nhật ký này"
                                      >
                                        <Edit className="w-4 h-4 inline-block" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteLog(log.id)}
                                        className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-955 bg-transparent border border-transparent transition cursor-pointer"
                                        title="Xóa dòng nhật ký"
                                      >
                                        <Trash2 className="w-4 h-4 inline-block" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}

                  {loggingSubTab === "hourly" && (
                    <motion.div
                      key="hourly-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-5"
                    >
                      {/* FILTER DATE & MINI INSIGHT */}
                      <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="space-y-1.5 self-start sm:self-auto w-full sm:w-auto">
                          <label className="text-[10px] text-slate-400 font-semibold font-mono uppercase block">Chọn Ngày Báo Cáo Khung Giờ:</label>
                          <select
                            value={recordsFilterDate}
                            onChange={(e) => setRecordsFilterDate(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500 w-full sm:w-auto min-w-[200px]"
                          >
                            <option value="ALL">🗓️ Tất cả các ngày (Lũy kế)</option>
                            {logsDates.map((d) => (
                              <option key={d} value={d}>
                                📅 Ngày {d}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex gap-4 text-xs font-mono self-end sm:self-auto">
                          <div className="text-center">
                            <span className="text-slate-500 text-[10px] block font-sans">Tổng SL (Cái)</span>
                            <span className="text-sm font-bold text-white">
                              {hourlyChartData.reduce((acc, curr) => acc + curr["Sản lượng (Cái)"], 0)} Cái
                            </span>
                          </div>
                          <div className="border-l border-slate-800 h-8 self-center"></div>
                          <div className="text-center">
                            <span className="text-slate-500 text-[10px] block font-sans">Tổng Quy Đổi</span>
                            <span className="text-sm font-bold text-sky-400">
                              {hourlyChartData.reduce((acc, curr) => acc + curr["Quy đổi (SP)"], 0)} SP
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* HOURLY DISTRIBUTION VISUAL GRAPH */}
                      <div className="h-[380px] bg-slate-1000 p-3.5 rounded-lg border border-slate-850 flex flex-col">
                        <h4 className="text-slate-300 text-[11px] font-semibold font-mono uppercase mb-3 text-center flex items-center justify-center gap-1.5 shrink-0">
                          <Clock className="w-4 h-4 text-rose-500" />
                          Phân bổ sản lượng lắp ráp theo khung giờ 1h / ca làm việc {recordsFilterDate !== "ALL" ? `- Ngày ${recordsFilterDate}` : "(Sát thực các ngày)"}
                        </h4>
                        <div className="flex-1 min-h-0">
                          <ResponsiveContainer width="99%" height="100%">
                            <ComposedChart data={hourlyChartData} margin={{ top: 40, right: 30, left: -25, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                              dataKey="slotName"
                              tick={{ fill: "#94a3b8", fontSize: 9 }}
                              axisLine={{ stroke: "#334155" }}
                            />
                            <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={{ stroke: "#334155" }} domain={YAXIS_DOMAIN} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#34d399", fontSize: 9 }} axisLine={{ stroke: "#334155" }} domain={YAXIS_DOMAIN} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "6px", fontSize: "11px" }}
                              itemStyle={{ color: "#f8fafc" }}
                            />
                            <Legend wrapperStyle={{ fontSize: "10px" }} />
                            <Bar isAnimationActive={false} yAxisId="left" dataKey="Sản lượng (Cái)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20}>
                              <LabelList dataKey="Sản lượng (Cái)" position="top" offset={5} fill="#f43f5e" fontSize={9} fontWeight="semibold" formatter={(v: any) => v && !Number.isNaN(v) ? v : ''} />
                            </Bar>
                            <Bar isAnimationActive={false} yAxisId="left" dataKey="Quy đổi (SP)" fill="#22d3ee" radius={[4, 4, 0, 0]} barSize={20}>
                              <LabelList dataKey="Quy đổi (SP)" position="top" offset={5} fill="#22d3ee" fontSize={9} fontWeight="semibold" formatter={(v: any) => v && !Number.isNaN(v) ? v : ''} />
                            </Bar>
                            <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="NSLĐ Đạt (%)" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: "#34d399" }}>
                              <LabelList dataKey="NSLĐ Đạt (%)" position="top" offset={12} fill="#34d399" fontSize={10} fontWeight="semibold" formatter={(v: any) => v && !Number.isNaN(v) ? `${v}%` : ''} />
                            </Line>
                          </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* MATRIX HOURLY TABLE */}
                      <div className="overflow-x-auto overflow-y-auto border border-slate-850/60 rounded-lg">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono text-[9px] uppercase sticky top-0 backdrop-blur">
                              <th className="py-2.5 px-3 min-w-[120px]">SP/Chuyền</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">08-09h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">09-10h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">10-11h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">11-12h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">13-14h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">14-15h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">15-16h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">16-17h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">17-18h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40 border-r border-slate-800/60">18-19h</th>
                              <th className="py-2.5 px-1.5 text-center bg-slate-900/40">19-20h</th>
                              <th className="py-2.5 px-2 text-right text-rose-400">Tổng</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850 font-mono text-[11px]">
                            {(() => {
                              const filteredLogs = productionLogs.filter((log) => {
                                const matchDate = recordsFilterDate === "ALL" || log.date === recordsFilterDate;
                                const matchDivision = filterDivision === "ALL" || log.productGroup === filterDivision;
                                return matchDate && matchDivision;
                              });

                              if (filteredLogs.length === 0) {
                                return (
                                  <tr key="empty-hourly">
                                    <td colSpan={13} className="py-8 text-center text-slate-500 italic font-sans">
                                      Không có dữ liệu khớp với bộ lọc ngày hoặc tổ sản xuất.
                                    </td>
                                  </tr>
                                );
                              }

                              return filteredLogs.map((log) => {
                                const h08_09 = log.hourlyActuals?.["8H - 9H"] !== undefined ? log.hourlyActuals["8H - 9H"] : null;
                                const h09_10 = log.hourlyActuals?.["9H - 10H"] !== undefined ? log.hourlyActuals["9H - 10H"] : null;
                                const h10_11 = log.hourlyActuals?.["10H - 11H"] !== undefined ? log.hourlyActuals["10H - 11H"] : null;
                                const h11_12 = log.hourlyActuals?.["11H - 12H"] !== undefined ? log.hourlyActuals["11H - 12H"] : null;
                                const h13_14 = log.hourlyActuals?.["13H - 14H"] !== undefined ? log.hourlyActuals["13H - 14H"] : null;
                                const h14_15 = log.hourlyActuals?.["14H - 15H"] !== undefined ? log.hourlyActuals["14H - 15H"] : null;
                                const h15_16 = log.hourlyActuals?.["15H - 16H"] !== undefined ? log.hourlyActuals["15H - 16H"] : null;
                                const h16_17 = log.hourlyActuals?.["16H - 17H"] !== undefined ? log.hourlyActuals["16H - 17H"] : null;
                                const h17_18 = log.hourlyActuals?.["17H - 18H"] !== undefined ? log.hourlyActuals["17H - 18H"] : null;
                                const h18_19 = log.hourlyActuals?.["18H - 19H"] !== undefined ? log.hourlyActuals["18H - 19H"] : null;
                                const h19_20 = log.hourlyActuals?.["19H - 20H"] !== undefined ? log.hourlyActuals["19H - 20H"] : null;

                                return (
                                  <tr key={log.id} className="hover:bg-slate-900 transition text-slate-300">
                                    <td className="py-2.5 px-3">
                                      <div className="text-white font-medium font-sans text-[11.5px] whitespace-normal break-words max-w-[250px]" title={log.productName}>
                                        {log.productName}
                                      </div>
                                      <div className="text-[9px] text-slate-500 font-mono">
                                        {log.date} | {log.lineName} | {log.shift.split(" ")[0]}
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-sky-400 font-bold border-r border-slate-900">
                                      {h08_09 !== null && !Number.isNaN(h08_09) ? h08_09 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-sky-400 font-bold border-r border-slate-900">
                                      {h09_10 !== null && !Number.isNaN(h09_10) ? h09_10 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-sky-400 font-bold border-r border-slate-900">
                                      {h10_11 !== null && !Number.isNaN(h10_11) ? h10_11 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-sky-400 font-bold border-r border-slate-900">
                                      {h11_12 !== null && !Number.isNaN(h11_12) ? h11_12 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-sky-400 font-bold border-r border-slate-900">
                                      {h13_14 !== null && !Number.isNaN(h13_14) ? h13_14 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-sky-400 font-bold border-r border-slate-900">
                                      {h14_15 !== null && !Number.isNaN(h14_15) ? h14_15 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-sky-400 font-bold border-r border-slate-900">
                                      {h15_16 !== null && !Number.isNaN(h15_16) ? h15_16 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-sky-400 font-bold border-r border-slate-900">
                                      {h16_17 !== null && !Number.isNaN(h16_17) ? h16_17 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-sky-400 font-bold border-r border-slate-900">
                                      {h17_18 !== null && !Number.isNaN(h17_18) ? h17_18 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-sky-400 font-bold border-r border-slate-900">
                                      {h18_19 !== null && !Number.isNaN(h18_19) ? h18_19 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-1.5 text-center bg-slate-1000 text-sky-400 font-bold border-r border-slate-900">
                                      {h19_20 !== null && !Number.isNaN(h19_20) ? h19_20 : <span className="text-slate-700 font-normal text-[10px]">-</span>}
                                    </td>
                                    <td className="py-2.5 px-2 text-right font-bold text-white text-[11px]">
                                      {(!log.actualUnits || Number.isNaN(log.actualUnits)) ? 0 : log.actualUnits}
                                    </td>
                                    <td className="py-2.5 px-2.5 text-center">
                                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                        log.laborProductivityPercent >= kpis.monthTarget
                                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-900/50"
                                          : "bg-amber-950/60 text-amber-400 border-amber-900/50"
                                      }`}>
                                        {log.laborProductivityPercent.toFixed(0)}%
                                      </span>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}

                  {loggingSubTab === "daily" && (
                    <motion.div
                      key="daily-summary-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4"
                    >
                      <div className="overflow-x-auto overflow-y-auto border border-slate-850 rounded-lg">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-900 border-b border-slate-700 text-slate-300 font-black text-xs uppercase tracking-wider sticky top-0 backdrop-blur shadow-sm">
                              <th className="py-3 px-3">Ngày sản xuất</th>
                              <th className="py-3 px-3">Phạm vi ca / Số model</th>
                              <th className="py-3 px-3">Dây chuyền hoạt động</th>
                              <th className="py-3 px-3">Sản phẩm chế tạo chính</th>
                              <th className="py-3 px-3 text-right">Tổng thực tế (Cái)</th>
                              <th className="py-3 px-3 text-right">MES quy đổi (SP)</th>
                              <th className="py-3 px-3 text-right">Tổng nhân lực gán</th>
                              <th className="py-3 px-3 text-center">Năng suất b.quân ngày</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {dailySummaries.length === 0 ? (
                              <tr key="empty-daily">
                                <td colSpan={8} className="py-8 text-center text-slate-500 font-sans italic">
                                  Chưa ghi nhận dữ liệu để tổng hợp theo ngày.
                                </td>
                              </tr>
                            ) : displayDailySummaries.length === 0 ? (
                              <tr key="filtered-empty-daily">
                                <td colSpan={8} className="py-8 text-center text-slate-500 font-sans italic">
                                  Không tìm thấy tổng hợp ngày khớp với bộ lọc ngày được chọn.
                                </td>
                              </tr>
                            ) : (
                              displayDailySummaries.map((summary) => (
                                <tr key={summary.date} className="hover:bg-slate-900 transition text-slate-300">
                                  <td className="py-3.5 px-3">
                                    <span className="font-bold text-white block text-[12px]">{summary.date}</span>
                                    <span className="text-[10px] text-rose-400 font-mono font-bold block mt-0.5">
                                      {summary.recordsCount} bản ghi n.ký
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-3 font-mono text-[11px]">
                                    <div className="text-slate-200">{summary.shiftCount} ca sản xuất</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">{summary.recordsCount} models</div>
                                  </td>
                                  <td className="py-3.5 px-3 text-[11px] font-sans text-slate-300">
                                    <div className="flex flex-col gap-0.5">
                                      {summary.uniqueLines.map((l) => (
                                        <span key={l} className="text-slate-300 font-semibold">• {l}</span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-3">
                                    <div className="flex flex-wrap gap-1 max-w-[190px]">
                                      {summary.uniqueProducts.map((p) => (
                                        <span key={p} className="text-[9px] bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.2 rounded whitespace-normal break-words max-w-[250px]" title={p}>
                                          {p}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-3 text-right font-mono text-white text-[11.5px] font-bold">
                                    {summary.totalActual || 0} <span className="text-[10px] text-slate-500 font-normal">Cái</span>
                                  </td>
                                  <td className="py-3.5 px-3 text-right font-mono text-sky-400 font-extrabold text-[12px]">
                                    {summary.totalEquivalent || 0} <span className="font-normal text-[9px] text-slate-500">SP</span>
                                  </td>
                                  <td className="py-3.5 px-3 text-right font-mono text-indigo-400 text-[11.5px] font-bold">
                                    {summary.totalWorkers || 0} <span className="text-[10px] text-slate-500 font-normal font-sans">công</span>
                                  </td>
                                  <td className="py-3.5 px-3 text-center">
                                    <span className={`inline-block font-mono font-extrabold px-2.5 py-0.5 rounded text-[11px] border ${
                                      Number(summary.avgProductivity) >= kpis.monthTarget
                                        ? "bg-emerald-950/80 text-emerald-400 border-emerald-900/50"
                                        : "bg-amber-950/80 text-amber-400 border-amber-900/50"
                                    }`}>
                                      {(Number(summary.avgProductivity) || 0).toFixed(1)}%
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-850 text-slate-450 text-xs flex justify-between items-center">
                  <span className="leading-snug">💡 Mẹo: Dữ liệu Nhật ký Ca tự động được lưu trữ và tổng hợp thời gian thực vào các bộ chỉ số năng suất KPI Tháng {parseInt(formDate.split("-")[1])}/{formDate.split("-")[0]} trên Dashboard!</span>
                  <button
                    onClick={() => {
                      const d = new Date();
                      const year = d.getFullYear();
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      setFormDate(`${year}-${month}-${day}`);
                      const slots = formSlots;
                      const testHrs: { [key: string]: number } = {};
                      slots.forEach((s) => {
                        testHrs[s] = 55;
                      });
                      setFormModelItems([
                        {
                          id: "item-example",
                          productId: "mln-01",
                          hourlyActuals: testHrs,
                        }
                      ]);
                      setFormMessage(`💡 Đã tự cấu hình thử dữ liệu bám sát Tháng ${parseInt(formDate.split("-")[1])}/${formDate.split("-")[0]} vào Form!`);
                    }}
                    className="text-xs text-rose-450 hover:text-white font-semibold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ml-4 border-0 bg-transparent font-sans"
                  >
                    Xem ví dụ <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </motion.div>
  );
};
