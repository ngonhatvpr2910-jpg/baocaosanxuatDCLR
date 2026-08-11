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

export const AnalyticsTab = ({
  handleTriggerAiAnalysis,
  isAiLoading,
  aiError,
  aiAnalysis
}: any) => {
  return (
    <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* TOP CHAT INSTRUCTION */}
              <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="text-rose-500 animate-pulse w-5 h-5" />
                    Báo Cáo Nghiên Cứu & Trợ Lý Kỹ Thuật Sản Xuất Sunhouse AI
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sử dụng mô hình ngôn ngữ lớn <strong>Google Gemini 3.5</strong> thông qua cổng bảo mật của ứng dụng để tự động phân tích sâu, phát hiện nút thắt cổ chai và đề xuất tối ưu hóa nhân sự.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleTriggerAiAnalysis}
                    disabled={isAiLoading}
                    className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold rounded-lg text-xs tracking-wider transition cursor-pointer flex items-center gap-2"
                    id="btn-reanalyze-ai"
                  >
                    {isAiLoading ? (
                      <>
                        <span className="w-3 h-3 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>
                        Đang phân tích số liệu...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white" />
                        PHÂN TÍCH LẠI VỚI GEMINI
                      </>
                    )}
                  </button>
                </div>
              </div>


              {/* MAIN REPORT VIEW CONTAINER */}
              <div className="bg-slate-900/30 rounded-xl border border-rose-900/30 overflow-hidden shadow-2xl relative">
                
                {/* Visual Accent bar */}
                <div className="h-1 bg-gradient-to-r from-rose-600 via-amber-500 to-cyan-500"></div>

                <div className="p-6">
                  
                  {isAiLoading && (
                    <div className="py-16 flex flex-col items-center justify-center space-y-4">
                      {/* Beautiful simulated manufacturing loading visual */}
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                      <div className="text-center space-y-1.5">
                        <span className="text-xs text-rose-400 font-mono block">INITIALIZING SUNHOUSE DECISION BRAIN</span>
                        <p className="text-sm font-medium text-slate-300">Đang đồng bộ số liệu excel & nhật ký sản xuất ca thực tế...</p>
                        <span className="text-[10px] text-slate-500 font-mono block">Connecting to secure Google GenAI Cloud via Applet Proxy...</span>
                      </div>
                    </div>
                  )}

                  {aiError && !isAiLoading && (
                    <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-400 rounded-lg text-xs space-y-2">
                      <div className="font-bold flex items-center gap-2">
                        <Info className="w-4 h-4" /> Không thể khởi chạy Trợ lý AI
                      </div>
                      <p>{aiError}</p>
                      <ul className="list-disc list-inside space-y-1 text-slate-350">
                        <li>Hãy chắc chắn bạn đã cấu hình khóa <strong>GEMINI_API_KEY</strong> trong phần cài đặt <strong>Secrets</strong> của AI Studio.</li>
                        <li>Đội ngũ kỹ thuật SUNHOUSE có thể truy cập mã nguồn để gán biến môi trường thủ công.</li>
                      </ul>
                    </div>
                  )}

                  {!isAiLoading && aiAnalysis && (
                    <div className="space-y-6 text-slate-200 leading-relaxed text-sm">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-5 h-5 text-emerald-400" />
                          <span className="text-sm font-bold text-white uppercase tracking-wider">BÁO CÁO NHÀ MÁY THỰC THI</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Bản phân tích tự động (Dữ liệu thời gian thực)</span>
                      </div>

                      {/* Render markdown analysis styled cleanly */}
                      <div className="prose prose-invert prose-rose max-w-none text-slate-300 font-sans space-y-4">
                        {aiAnalysis.split("\n").map((line, idx) => {
                          // Very basic markdown formatting parser for pristine UI
                          if (line.startsWith("###")) {
                            return (
                              <h4 key={idx} className="text-sm font-bold text-white border-l-4 border-rose-500 pl-2 mt-4 mb-2">
                                {line.replace("###", "").trim()}
                              </h4>
                            );
                          }
                          if (line.startsWith("##")) {
                            return (
                              <h3 key={idx} className="text-base font-bold text-rose-400 border-b border-slate-800 pb-1 mt-6 mb-3">
                                {line.replace("##", "").trim()}
                              </h3>
                            );
                          }
                          if (line.startsWith("#")) {
                            return (
                              <h2 key={idx} className="text-lg font-bold text-white mt-8 mb-4">
                                {line.replace("#", "").trim()}
                              </h2>
                            );
                          }
                          if (line.startsWith("-") || line.startsWith("*")) {
                            return (
                              <li key={idx} className="ml-4 list-disc text-slate-300 py-0.5">
                                {line.replace(/^[-*]\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1")}
                              </li>
                            );
                          }
                          return (
                            <p key={idx} className="text-xs md:text-sm text-slate-300 leading-relaxed text-justify">
                              {/* Bold conversion */}
                              {line.split("**").map((part, i) => (i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : part))}
                            </p>
                          );
                        })}
                      </div>

                      {/* Closing Sign-off */}
                      <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <div>
                          <span>Phê duyệt bởi:</span>
                          <strong className="text-slate-300 font-semibold block uppercase">Cơ sở sản xuất NM Bình Dương</strong>
                        </div>
                        <div>
                          <span>Bộ phận IE:</span>
                          <span className="text-rose-400 font-mono font-bold block">SUNHOUSE VIETNAM GROUP</span>
                        </div>
                      </div>

                    </div>
                  )}

                  {!isAiLoading && !aiAnalysis && !aiError && (
                    <div className="py-20 text-center space-y-4">
                      <Sparkles className="w-10 h-10 text-slate-600 mx-auto" />
                      <p className="text-sm text-slate-400 max-w-md mx-auto">
                        Số liệu đã sẵn sàng để chuyển giao sang hệ AI Phân Tích. Nhấp vào nút bên dưới để khởi tạo cuộc gọi dữ liệu và nhận chiến lược cân bằng chuyền.
                      </p>
                      <button
                        onClick={handleTriggerAiAnalysis}
                        className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs uppercase"
                        id="btn-trigger-analytics"
                      >
                        BẮT ĐẦU PHÂN TÍCH AI
                      </button>
                    </div>
                  )}

                </div>
              </div>

            </motion.div>
  );
};
