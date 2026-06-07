"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function searchProfilesAction(query: string) {
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, data: [] };
    }

    const supabase = await createServerSupabaseClient();

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .ilike("full_name", `%${query.trim()}%`) //  للبحث عن جزء من الاسم
      .limit(7); 

    if (error) throw error;

    return { success: true, data: profiles || [] };
  } catch (error: unknown) {
    console.error("searchProfilesAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء البحث",
      data: [],
    };
  }
}