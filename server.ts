/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dns from "dns";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Tải biến môi trường
dotenv.config();

// Khởi tạo Gemini client từ bộ SDK @google/genai mới nhất
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware phân tích JSON
  app.use(express.json());

  // === CÁC TUYẾN API CHẠY TRÊN SERVER ===

  // API kiểm tra trạng thái hoạt động
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // API sử dụng trí tuệ nhân tạo Gemini để phân tích dữ liệu sản xuất
  app.post("/api/ai-analyze", async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { selectedYear, yearlyMetricData, filterDivision, customLogs, weeklyAttendance, monthlyScrapReport, weeklyScrapReport, weeklyDclreErrorRate, monthlyDclreErrorRate } = req.body;

      if (!yearlyMetricData || !Array.isArray(yearlyMetricData)) {
        res.status(400).json({ error: "Missing statistical data payload." });
        return;
      }

      // Tạo ngữ cảnh chi tiết cho AI
      let prompt = `Bạn là Chuyên gia phân tích và Tối ưu hóa Sản xuất cao cấp (Industrial Engineer) của Tập đoàn Điện gia dụng SUNHOUSE Việt Nam.
Hãy phân tích báo cáo hiệu suất sản xuất các dòng Máy lọc nước (MLN) và Bếp gas (BG) tại Nhà Máy Bình Dương dựa trên số liệu thực tế được cung cấp.

THÔNG TIN BÁO CÁO:
- Năm báo cáo: ${selectedYear}
- Bộ phận phân tích lựa chọn: ${filterDivision === "ALL" ? "Tất cả (Máy lọc nước & Bếp gas)" : filterDivision === "MLN" ? "Phân xưởng Máy Lọc Nước" : "Phân xưởng Bếp Gas"}
- Định mức Tiêu chuẩn của SUNHOUSE: 9.03 sản phẩm quy đổ / ngày công.
- Mục tiêu hiệu suất Lao động lũy kế cả năm (Target): 110.0%.

SỐ LIỆU SẢN XUẤT THEO BIỀU ĐỒ VÀ BẢNG EXCEL:
${yearlyMetricData
  .map(
    (m: any) =>
      `- Tháng ${m.month}/${m.year}: NSLĐ đạt ${m.laborProductivityPercent ? m.laborProductivityPercent + "%" : "Chưa có"}, Số ngày công lắp ráp DCLR: ${m.productionMandays ? m.productionMandays + " Công" : "Chưa có"}, Số lượng sản phẩm quy đổi: ${m.equivalentProducts ? m.equivalentProducts + " SP" : "Chưa có"}`
  )
  .join("\n")}

DỮ LIỆU CHẤT LƯỢNG MỚI BỔ SUNG TỪ EXCEL:
- Tổn thất hàng hỏng theo Tháng: T1: 7.8M, T2: 7M, T3: 28.39M (Đạt đỉnh!), T4: 17.49M, T5: 10M, T6: 5.08M, T7: 1.2M VND.
- Tổn thất hàng hỏng theo Tuần: W23: 3.37M, W24: 1.7M, W27: 0.8M VND.
- Tỉ lệ lỗi thao tác DCLR theo tuần: W21: 2.3%, W22: 2.6%, W23: 2.9%, W24: 1.7%, W27: 1.1%.
- Tỉ lệ lỗi thao tác DCLR theo tháng: T1: 1.9%, T2: 3.6%, T3: 5.0% (Đạt đỉnh!), T4: 4.0%, T5: 2.6%, T6: 2.3%, T7: 1.5%.

${
  customLogs && customLogs.length > 0
    ? `CÁC NHẬT KÝ SẢN XUẤT CA MỚI NHẤT TRONG HỆ THỐNG:
${customLogs
  .slice(0, 10)
  .map(
    (l: any) =>
      `- Ngày ${l.date} | ${l.shift} | Chuyền: ${l.lineName} | Sản phẩm: ${l.productName} | Lượng lắp ráp: ${l.actualUnits} cái (Hệ số quy đổi: ${l.equivalentFactor}) | Số công nhân: ${l.workersCount} người | Hiệu suất ca đạt: ${l.laborProductivityPercent ? l.laborProductivityPercent.toFixed(1) + "%" : "Chưa tính"}`
  )
  .join("\n")}`
    : ""
}

Nhiệm vụ của bạn là hãy viết một bản Đánh giá chuyên sâu, khúc chiết, phân tích bằng tiếng Việt, bao gồm các ý chính sau:
1. **Tổng quan Đánh giá Hiệu suất**:
    - Chỉ ra tháng nào có năng suất tăng đột biến cao nhất, thấp nhất trong năm. So sánh xem năm nay đã đạt được mục tiêu 110% hay chưa (lưu ý tháng 7/2026 có NSLĐ đột phá 113% nhưng sản lượng quy đổi mới đạt 4,708/12,167 KHSX, vì sao vậy?). Trả lời chi tiết: là do số lượng công sản xuất trong tháng 7 mới đạt 456 công (ít hơn hẳn các tháng trước như tháng 5 đạt 2,498 công), nghĩa là số ngày làm việc thực tế trong tháng 7 chỉ mới trôi qua một phần tính đến ngày hôm nay 12/07/2026!
2. **Mối tương quan giữa Hao Hụt & Lỗi Thao tác (DCLR)**:
   - Phân tích hiện tượng đặc biệt: Tháng 3 có tỷ lệ lỗi thao tác cao đỉnh điểm (5.0%) đồng bộ tịnh tiến với cước phí hàng hỏng đạt đỉnh lịch sử 28,391,248 VND.
   - Khen ngợi nỗ lực giảm lỗi thao tác về mức 1.5% và chi phí hỏng về 1.2M VND trong Tháng 7 nhờ triển khai đào tạo nâng cấp kỹ năng.
3. **Giải pháp Industrial Engineering (IE) độc quyền cho SUNHOUSE**:
   - Đưa ra 3 khuyến nghị hành động thực tế nhằm tối ưu hóa dây chuyền sản xuất lắp ráp máy lọc nước và bếp gas (ví dụ: tối ưu hóa jig bấm lõi lọc nước để hạn chế lỗi trầy xước, lắp đặt chụp lò xo cân bằng chuyền lắp họng lửa ga hạn chế nứt kính tủ slim, tự động tắt áp sau test rò nước tránh rỉ họng sắt).

Yêu cầu nội dung:
- Trình bày chuyên nghiệp, ngắn gọn dưới dạng Markdown, có sơ đồ danh sách, ngôn ngữ sắc sảo, thực tế của quản lý nhà máy.
- Không sáo rỗng, đi thẳng vào các chỉ số kỹ thuật và điều hành sản xuất.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const analysisText = response.text;
      res.json({ analysis: analysisText });
    } catch (error: any) {
      console.error("Gemini AI API Error:", error);
      res.status(500).json({
        error: "Đã xảy ra lỗi khi kết nối với máy chủ AI của Google. Vui lòng kiểm tra cấu hình khóa bí mật của bạn.",
        details: error.message,
      });
    }
  });

  // === ĐIỀU HƯỚNG VÀ PHỤC VỤ TRANG CLIENT ===

  if (process.env.NODE_ENV !== "production") {
    // Luồng phát triển: Tích hợp Vite làm middleware cho Express
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Luồng sản xuất: Phục vụ các tệp tĩnh đã biên dịch trong thư mục dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Khởi động lắng nghe cổng 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SUNHOUSE SERVER] Hệ thống đang vận hành tại http://localhost:${PORT}`);
  });
}

startServer();
