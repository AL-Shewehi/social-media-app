"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function loginUser(values: { email: string; password: string }) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function registerUser(values: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
}) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        firstName: values.firstName,
        lastName: values.lastName,
        birthDate: values.birthDate,
        gender: values.gender,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}


export async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error("يجب تسجيل الدخول أولاً للقيام بهذا الإجراء");
  }
  return { supabase, user };
}