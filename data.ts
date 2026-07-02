/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MonthlyMetric,
  ProductDefinition,
  ProductionLine,
  TargetComparison,
  ProductionLog,
  WeeklyAttendance,
  MonthlyScrapReport,
  WeeklyScrapReport,
  WeeklyDclreErrorRate,
  MonthlyDclreErrorRate,
  DailyReportRowGas,
  DailyReportRowAssembly,
  CombinedDailyReportRow,
} from "./types";

// Định mức hiệu suất lao động tiêu chuẩn của NHÀ MÁY SUNHOUSE
// 1 Công Lao Động tiêu chuẩn = 9.03 sản phẩm quy đổi / ngày công
export const INDUSTRIAL_STANDARDS = {
  standardQtyPerManday: 9.03, // Sản phẩm quy đổi / Công
  targetProductivityRatio: 1.10, // Mục tiêu 110%
};

// Danh mục định nghĩa sản phẩm với Hệ số quy đổi (Industrial factors)
// Hệ số quy đổi tính dựa trên thời gian chu kỳ (Cycle Time) và công sức lắp ráp tiêu chuẩn so với dòng cơ bản (1.0)
export const SUNHOUSE_PRODUCTS: ProductDefinition[] = [
  // --- BẾP GAS (BG) ---
  {
    id: "bg-01",
    name: "Bếp gas dương kính Sunhouse Mama MMBB0787B (Khung sơn)",
    group: "BG",
    code: "BBDK2MMBB0787B",
    factor: 0.28,
    description: "Bếp gas dương kính Sunhouse Mama MMBB0787B (Khung sơn)."
  },
  {
    id: "bg-02",
    name: "Bếp gas dương kính Sunhouse Mama MMBB0787MT (Khung sơn)",
    group: "BG",
    code: "BBDK2MMBB0787MT",
    factor: 0.28,
    description: "Bếp gas dương kính Sunhouse Mama MMBB0787MT (Khung sơn)."
  },
  {
    id: "bg-03",
    name: "Bếp gas dương kính Sunhouse SHB2106",
    group: "BG",
    code: "BBDK2SHB2106",
    factor: 0.23,
    description: "Bếp gas dương kính Sunhouse SHB2106."
  },
  {
    id: "bg-04",
    name: "Bếp gas dương kính Sunhouse SHB3326MT",
    group: "BG",
    code: "BBDK2SHB3326MT",
    factor: 0.23,
    description: "Bếp gas dương kính Sunhouse SHB3326MT."
  },
  {
    id: "bg-05",
    name: "Bếp ga dương kính họng hộp Sunhouse mama MMB0781S",
    group: "BG",
    code: "BBDKHHSHMMB0781S",
    factor: 0.32,
    description: "Bếp ga dương kính họng hộp Sunhouse mama MMB0781S."
  },
  {
    id: "bg-06",
    name: "Bếp gas dương kính Sunhouse Mama MMB3569MT",
    group: "BG",
    code: "BBDMMB3569MT",
    factor: 0.32,
    description: "Bếp gas dương kính Sunhouse Mama MMB3569MT."
  },
  {
    id: "bg-07",
    name: "Bếp gas dương kính Sunhouse SHB31012-VMC",
    group: "BG",
    code: "BBDSHB31012VMC",
    factor: 0.23,
    description: "Bếp gas dương kính Sunhouse SHB31012-VMC."
  },
  {
    id: "bg-08",
    name: "Bếp gas dương kính Sunhouse SHB31022-V",
    group: "BG",
    code: "BBDSHB31022V",
    factor: 0.23,
    description: "Bếp gas dương kính Sunhouse SHB31022-V."
  },
  {
    id: "bg-09",
    name: "Bếp gas dương kính Sunhouse SHB31032-V",
    group: "BG",
    code: "BBDSHB31032V",
    factor: 0.23,
    description: "Bếp gas dương kính Sunhouse SHB31032-V."
  },
  {
    id: "bg-10",
    name: "Bếp gas dương kính Sunhouse SHB32012-VMC",
    group: "BG",
    code: "BBDSHB32012VMC",
    factor: 0.23,
    description: "Bếp gas dương kính Sunhouse SHB32012-VMC."
  },
  {
    id: "bg-11",
    name: "Bếp gas dương kính Sunhouse SHB3223MT",
    group: "BG",
    code: "BBDSHB3223MT",
    factor: 0.32,
    description: "Bếp gas dương kính Sunhouse SHB3223MT."
  },

  // --- MÁY LỌC NƯỚC (MLN) ---
  {
    id: "mln-01",
    name: "Mô hình máy lọc nước RO Sunhouse 11 lõi SHA76222KL",
    group: "MLN",
    code: "MMKROSHA76222KLMH",
    factor: 0.90,
    description: "Mô hình máy lọc nước RO Sunhouse 11 lõi SHA76222KL."
  },
  {
    id: "mln-02",
    name: "Máy lọc nước ion kiềm Hydrogen UltraX Sunhouse SHA75102LA",
    group: "MLN",
    code: "RMVSHA75102LA",
    factor: 2.25,
    description: "Máy lọc nước ion kiềm Hydrogen UltraX Sunhouse SHA75102LA."
  },
  {
    id: "mln-03",
    name: "Máy lọc nước RO UltraPURE Sunhouse 10 lõi SHA76211KL",
    group: "MLN",
    code: "RMVSHA76211KL",
    factor: 2.25,
    description: "Máy lọc nước RO UltraPURE Sunhouse 10 lõi SHA76211KL."
  },
  {
    id: "mln-04",
    name: "Máy lọc nước RO NL 10 lõi Sunhouse SHA76213CK-S",
    group: "MLN",
    code: "RMVSHA76213CK",
    factor: 2.40,
    description: "Máy lọc nước RO NL 10 lõi Sunhouse SHA76213CK-S."
  },
  {
    id: "mln-05",
    name: "Máy lọc nước RO UltraPURE Sunhouse 11 lõi SHA76222KL",
    group: "MLN",
    code: "RMVSHA76222KL",
    factor: 2.40,
    description: "Máy lọc nước RO UltraPURE Sunhouse 11 lõi SHA76222KL."
  },
  {
    id: "mln-06",
    name: "Máy lọc nước RO UltraPURE Sunhouse 11 lõi SHA76225L",
    group: "MLN",
    code: "RMVSHA76225L",
    factor: 2.00,
    description: "Máy lọc nước RO UltraPURE Sunhouse 11 lõi SHA76225L."
  },
  {
    id: "mln-07",
    name: "Máy lọc nước RO UltraPURE Sunhouse 11 lõi SHA76226L",
    group: "MLN",
    code: "RMVSHA76226L",
    factor: 2.00,
    description: "Máy lọc nước RO UltraPURE Sunhouse 11 lõi SHA76226L."
  },
  {
    id: "mln-08",
    name: "Máy lọc nước ion kiềm Hydrogen UltraX Sunhouse SHA76258LA",
    group: "MLN",
    code: "RMVSHA76258LA",
    factor: 2.00,
    description: "Máy lọc nước ion kiềm Hydrogen UltraX Sunhouse SHA76258LA."
  },
  {
    id: "mln-09",
    name: "Máy lọc nước RO UltraX Sunhouse 11 lõi SHA76601S",
    group: "MLN",
    code: "RMVSHA76601S",
    factor: 3.00,
    description: "Máy lọc nước RO UltraX Sunhouse 11 lõi SHA76601S."
  },
  {
    id: "mln-10",
    name: "Máy lọc nước RO UltraPURE Sunhouse 10 lõi SHA76620KL",
    group: "MLN",
    code: "RMVSHA76620KL",
    factor: 2.40,
    description: "Máy lọc nước RO UltraPURE Sunhouse 10 lõi SHA76620KL."
  }
];

// Danh sách các Dây Chuyền Lắp Ráp (DCLR) Nhà Máy Bình Dương (NMBD) & Đông Anh (NMDA)
export const SUNHOUSE_LINES: ProductionLine[] = [
  { id: "line-ro", name: "DCRO", group: "MLN", location: "NMBD", targetDailyQty: 150 },
  { id: "line-bg", name: "DCBG", group: "BG", location: "NMBD", targetDailyQty: 160 }
];

// Số liệu gốc 2025 từ bảng Excel
export const HISTORICAL_2025: MonthlyMetric[] = Array.from({ length: 12 }).map((_, i) => ({ year: 2025, month: i + 1, laborProductivityPercent: null, productionMandays: null, equivalentProducts: null, attendanceRatePercent: null }));

// Số liệu gốc 2026 từ bảng Excel (cho đến tháng 6 hiện tại)
export const HISTORICAL_2026: MonthlyMetric[] = Array.from({ length: 12 }).map((_, i) => ({ year: 2026, month: i + 1, laborProductivityPercent: null, productionMandays: null, equivalentProducts: null, attendanceRatePercent: null }));

// So sánh mục tiêu tháng 6/2026 (Thực hiện so với kế hoạch và lũy kế)
export const CURRENT_STATE_SUMMARY: TargetComparison = {
  khsx: 0,
  actual: 0,
  attendanceRate: 0,
  productivityTarget: 110.0,
  productivityActual: 0,
};

// Chuẩn bị một số nhật ký mẫu để hiển thị khi người dùng vào app đầu tiên
export const INITIAL_PRODUCTION_LOGS: ProductionLog[] = [];

// --- DỮ LIỆU ĐƯỢC BỔ SUNG TỪ BẢNG EXCEL ĐÍNH KÈM CHẤT LƯỢNG & ĐI LÀM ---

// 1. Tỉ lệ đi làm tuần
export const WEEKLY_ATTENDANCE: WeeklyAttendance[] = Array.from({ length: 12 }).map((_, i) => ({ week: "W" + (22 + i), rate: null }));

// 2. Báo cáo hàng hỏng Tháng (VND)
export const MONTHLY_SCRAP_REPORT: MonthlyScrapReport[] = Array.from({ length: 12 }).map((_, i) => ({ month: i + 1, scrapCost: null }));

// 3. Báo cáo hàng hỏng Tuần (VND)
export const WEEKLY_SCRAP_REPORT: WeeklyScrapReport[] = Array.from({ length: 12 }).map((_, i) => ({ week: "W" + (23 + i), scrapCost: null }));

// 4. Tỉ Lệ Lỗi Thao Tác DCLR TUẦN
export const WEEKLY_DCLR_ERROR_RATE: WeeklyDclreErrorRate[] = Array.from({ length: 12 }).map((_, i) => ({ week: "W" + (21 + i), errorRate: null }));

// 5. Tỉ Lệ Lỗi Thao Tác DCLR THÁNG
export const MONTHLY_DCLR_ERROR_RATE: MonthlyDclreErrorRate[] = Array.from({ length: 12 }).map((_, i) => ({ month: i + 1, errorRate: null }));

// --- DỮ LIỆU BÁO CÁO HÀNG NGÀY CHO 2 DÂY CHUYỀN LẮP RÁP & BẾP GA ---

// 6. Dây chuyền Bếp Gas (Blue)
export const INITIAL_GAS_DAILY_REPORTS: DailyReportRowGas[] = [];

// 7. Dây chuyền Lắp ráp / Line Chính (Green)
export const INITIAL_ASSEMBLY_DAILY_REPORTS: DailyReportRowAssembly[] = [];


