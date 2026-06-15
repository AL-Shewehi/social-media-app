"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withErrorHandling } from "@/lib/with-error-handling";

// Login Action
export async function loginUser(values: { email: string; password: string }) {
  return withErrorHandling(async () => {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) throw error;

    return null;
  }, "فشل تسجيل الدخول. تأكد من صحة البريد الإلكتروني وكلمة المرور.");
}

// Registration Action
export async function registerUser(values: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
}) {
  return withErrorHandling(async () => {
    const supabase = await createServerSupabaseClient();
    const fullName = `${values.firstName} ${values.lastName}`.trim();

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: fullName,
          first_name: values.firstName,
          last_name: values.lastName,
          birth_date: values.birthDate,
          gender: values.gender,
        },
      },
    });

    if (error) throw error;

    //  فحص هل الحساب محتاج تفعيل إيميل؟
    if (data.user && !data.session) {
       return { 
         success: true, 
         requiresConfirmation: true, 
         message: "تم إنشاء الحساب بنجاح. يرجى مراجعة بريدك الإلكتروني لتأكيد الحساب قبل تسجيل الدخول." 
       };
    }

    return { success: true, requiresConfirmation: false };
  }, "حدث خطأ أثناء إنشاء الحساب الجديد.");
}
