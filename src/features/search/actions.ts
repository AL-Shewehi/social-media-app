"use server";

import { requireUser } from "@/lib/supabase/server";
import { withErrorHandling } from "@/lib/with-error-handling";

export async function searchProfilesAction(query: string) {
 return withErrorHandling(async () => {
    const { supabase } = await requireUser();

    if (!query || query.trim().length < 2) {
      return [];
    }

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .ilike("full_name", `%${query.trim()}%`)
      .limit(7); 

    if (error) throw error;

    return profiles || [];
  }, "حدث خطأ أثناء البحث");
}