/// <reference types="vite/client" />
import { SupabaseClient } from '@supabase/supabase-js';

// Tính năng đồng bộ Supabase đã được tắt theo yêu cầu của người dùng
export const isSupabaseConfigured = false;
export const supabaseUrl: string = '';
export const supabaseAnonKey: string = '';

// Supabase client được gán null để chuyển hoàn toàn sang cơ chế lưu trữ cục bộ (Local Storage)
export const supabase: SupabaseClient | null = null;



