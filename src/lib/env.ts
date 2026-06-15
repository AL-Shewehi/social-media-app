export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

if (!env.supabaseUrl || !env.supabaseAnonKey) {
  throw new Error(
    "❌ خطأ فادح: المتغيرات البيئية NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY مفقودة!"
  );
}