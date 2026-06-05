import { createClient } from '@supabase/supabase-js';

// هنجيب المتغيرات من ملف الـ .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// تطبيق Singleton Pattern لضمان عدم إنشاء أكثر من نسخة من الـ Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);