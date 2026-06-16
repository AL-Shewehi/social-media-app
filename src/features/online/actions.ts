"use server";

import { requireUser } from "@/lib/supabase/server";
import { withErrorHandling } from "@/lib/with-error-handling";

export async function getFriendIdsAction() {
  return withErrorHandling(async () => {
    const { supabase, user } = await requireUser();

    const { data, error } = await supabase
      .from("friendships")
      .select("sender_id, receiver_id")
      .eq("status", "accepted")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (error) throw error;

    const friendIds = (data ?? []).map((f) =>
      f.sender_id === user.id ? f.receiver_id : f.sender_id
    );

    return friendIds;
  }, "Failed to fetch friend IDs");
}
