/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Thông tin kết nối Supabase mặc định (dự phòng)
const DEFAULT_SUPABASE_URL = 'https://rxjvvfoxmdfakcbqskwn.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_SJSVyW7MUw2FK4fs3IIgGw_0bor6Hzn';

// Đọc thông tin kết nối trực tiếp từ biến môi trường Vite
export const supabaseUrl: string =
  (import.meta.env?.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
export const supabaseAnonKey: string =
  (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_ANON_KEY;

// Kiểm tra xem biến môi trường đã được cấu hình hợp lệ chưa
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('your-project') &&
  supabaseUrl.startsWith('http')
);

// Khởi tạo Supabase client kết nối TRỰC TIẾP tới URL của Supabase
// Tuyệt đối không dùng proxy qua URL của app (như window.location.origin hay APP_URL)
// để đảm bảo kết nối WebSocket Realtime (wss://*.supabase.co/realtime/v1/websocket)
// không bị định tuyến nhầm vào máy chủ ứng dụng / Vercel gây lỗi 404.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;


