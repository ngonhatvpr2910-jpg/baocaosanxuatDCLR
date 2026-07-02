/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Định nghĩa chủng loại sản phẩm (Water Purifiers & Gas Stoves)
export type ProductGroup = "MLN" | "BG"; // Máy Lọc Nước | Bếp Gas

export interface ProductDefinition {
  id: string;
  name: string;
  group: ProductGroup;
  code: string;
  factor: number; // Hệ số quy đổi (Ví dụ: Máy lọc RO nước nóng lạnh = 1.5, Bếp cũ = 0.8)
  description: string;
  price?: number; // Giá bán (VND)
}

// Định nghĩa Dây chuyền sản xuất (DCLR - Dây chuyền lắp ráp)
export interface ProductionLine {
  id: string;
  name: string;
  group: ProductGroup;
  location: "NMBD" | "NMND"; // Nhà Máy Bình Dương | Nhà Máy Đông Anh
  targetDailyQty?: number; // Chỉ tiêu sản phẩm quy đổi hàng ngày
}

// Số liệu báo cáo hàng tháng (tương xứng với dữ liệu trong ảnh)
export interface MonthlyMetric {
  year: number;
  month: number; // 1 to 12
  laborProductivityPercent: number | null; // Năng suất lao động lũy kế (%)
  productionMandays: number | null; // Tổng công sản xuất DCLR (Công)
  equivalentProducts: number | null; // Tổng sản phẩm quy đổi (Sản phẩm)
  actualProducts?: number | null; // Sản phẩm thực tế (trước quy đổi)
  attendanceRatePercent?: number | null; // Tỉ lệ đi làm (%)
}

// Nhật ký sản xuất ca làm việc (Do người dùng ghi nhận)
export interface ProductionLog {
  id: string;
  date: string; // YYYY-MM-DD
  lineId: string;
  lineName: string;
  productId: string;
  productName: string;
  productGroup: ProductGroup;
  actualUnits: number; // Số lượng thực tế lắp ráp xong
  workersCount: number; // Số lượng lao động (công tham gia)
  officialWorkers?: number;
  seasonalWorkers?: number;
  equivalentFactor: number; // Hệ số quy đổi tại thời điểm đó
  equivalentProducts: number; // Số lượng quy đổi = actualUnits * equivalentFactor
  laborProductivityPercent: number; // Năng suất của nhật ký này = (equivalentProducts / workersCount) / 9.03 * 100%
  shift: "Ca HC (08:00 - 17:00)" | "Ca HC (08:00 - 19h)" | "Ca HC (08:00 - 20h00)";
  technicianName: string;
  hourlyActuals?: { [slotName: string]: number };
  hourlyWorkers?: { [slotName: string]: number };
}

// Chỉ số thống kê KHSX của tháng hiện tại (Tháng 6/2026)
export interface TargetComparison {
  khsx: number; // Kế hoạch sản xuất (Sản phẩm quy đổi) - Ví dụ: 20167
  actual: number; // Thực tế lũy kế (Sản phẩm quy đổi) - Ví dụ: 8708
  attendanceRate: number; // Tỉ lệ đi làm trung bình - Ví dụ: 94.6%
  productivityTarget: number; // Mục tiêu năng suất - Ví dụ: 110%
  productivityActual: number; // Thực tế năng suất - Ví dụ: 99.38% (hoặc 113% riêng tháng 6)
}

// === CÁC TIÊU CHÍ VỀ CHẤT LƯỢNG & ĐI LÀM MỚI TỪ EXCEL ===
export interface WeeklyAttendance {
  week: string;
  rate: number | null; // Tỉ lệ đi làm theo tuần (%)
}

export interface MonthlyScrapReport {
  month: number;
  scrapCost: number | null; // Báo cáo hàng hỏng Tháng (VND)
}

export interface WeeklyScrapReport {
  week: string;
  scrapCost: number | null; // Báo cáo hàng hỏng Tuần (VND)
}

export interface WeeklyDclreErrorRate {
  week: string;
  errorRate: number | null; // Tỉ Lệ Lỗi Thao Tác DCLR TUẦN (%)
}

export interface MonthlyDclreErrorRate {
  month: number;
  errorRate: number | null; // Tỉ Lệ Lỗi Thao Tác DCLR THÁNG (%)
}

// === CẤU TRÚC BÁO CÁO HÀNG NGÀY CHI TIẾT (EXCEL CHI TIẾT) ===
export interface DailyReportRowGas {
  date: string; // Tên ngày, ví dụ "01-Jun", "03-Jun", "04-Jun", "W1", "05-Jun"...
  congGasStove: number; // CÔNG Bếp GA
  congSeasonal: number; // CÔNG THỜI VỤ
  congRma: number; // CÔNG RMA
  outputStove: number; // SẢN LƯỢNG QUY ĐỔI Bếp Ga
  actualStove?: number; // SẢN LƯỢNG THỰC TẾ Bếp Ga
  outputRma: number; // SẢN LƯỢNG QUY ĐỔI RMA
  actualRma?: number; // SẢN LƯỢNG THỰC TẾ RMA
  dinhmucSlTheoNs: number; // ĐỊNH MỨC SL THEO NS
  nsldTheoNgay: number; // NSLĐ THEO NGÀY (% ví dụ 73.3)
  tongNhanSuLine: number; // Tổng nhân sự Line
  nhansuNghi: number; // Nhân sự nghỉ
  tileDiLam: number; // TỈ LỆ ĐI LÀM (% ví dụ 100)
  isSummary?: boolean; // Nếu là hàng tổng hợp tuần (VD: "W1")
  isOff?: boolean; // Nếu là ngày chủ nhật nghỉ (Ví dụ "07-Jun")
}

export interface DailyReportRowAssembly {
  date: string; // Tên ngày, ví dụ "01-Jun", "02-Jun", "W22/T6", "05-Jun"...
  congChinhThuc: number; // CÔNG CHÍNH THỨC
  congThoiVu: number; // CÔNG THỜI VỤ
  outputLineChinh: number; // SẢN LƯỢNG QUY ĐỔI LINE CHÍNH
  actualLineChinh?: number; // SẢN LƯỢNG THỰC TẾ LINE CHÍNH
  dinhmucSlTheoNs: number; // ĐỊNH MỨC SL THEO NS
  nsldTheoNgay: number; // NSLĐ THEO NGÀY (% ví dụ 122.1)
  khsxNgay: number; // KHSX NGÀY
  tileHoanThanhKhsx: number; // TỈ LỆ HOÀN THÀNH KHSX NGÀY (% ví dụ 117.1)
  tongNhanSuLineDiLam: number; // TỔNG NHÂN SỰ LINE ĐI LÀM
  tongNhansuNghi: number; // TỔNG NHÂN SỰ NGHỈ
  tileDiLam: number; // TỈ LỆ ĐI LÀM (% ví dụ 87.3)
  isSummary?: boolean; // Nếu là hàng tổng hợp tuần (VD: "W22/T6")
}

// === CẤU TRÚC DỮ LIỆU CHÍNH TÍNH TỔNG 2 DÂY CHUYỀN ===
export interface CombinedDailyReportRow {
  date: string; // Ngày ví dụ "01-Jun", "03-Jun", "04-Jun"...
  totalCong: number; // Tổng công (Bếp Gas + Lắp Ráp) = (công Gas + công Thời vụ Gas + RMA Gas) + (công Chính thức Lắp ráp + công Thời vụ Lắp ráp)
  totalOutput: number; // Tổng sản lượng quy đổi = (Sản lượng Gas + RMA Gas) + (Sản lượng Lắp Ráp)
  totalActualOutput?: number; // Tổng sản lượng thực tế
  totalDinhmucSlTheoNs: number; // Tổng định mức sản lượng theo năng suất
  combinedNsld: number; // Năng suất lao động tổng hợp (%) = (totalOutput / totalCong) / 9.03 * 100%
  totalNhanSuDiLam: number; // Tổng nhân sự đi làm lẻ
  totalNhanSuNghi: number; // Tổng nhân sự nghỉ lẻ
  combinedTileDiLam: number; // Tỉ lệ đi làm bình quân (%) = totalNhanSuDiLam / (totalNhanSuDiLam + totalNhanSuNghi) * 100%
  khsxDailyCombined: number; // Chỉ tiêu kế hoạch gộp
  tileHoanThanhKhsxCombined: number; // Tỉ lệ hoàn thành KHSX gộp (%)
}

