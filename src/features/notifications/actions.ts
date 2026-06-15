"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import { requireUser } from "@/lib/supabase/server";
import { normalizeProfile } from "@/lib/normalize";
import type { NotificationItem, NotificationActor } from "@/components/shared/NotificationsDropdown";

export async function fetchNotificationsAction(cursor?: string) {
    return withErrorHandling(async () => {
        const { supabase, user } = await requireUser();

        let query = supabase.from("notifications")
            .select(`
                id,
                created_at,
                type,
                post_id,
                comment_id,
                is_read,
                actor:profiles!notifications_actor_id_fkey(id, full_name, avatar_url)
            `)
            .eq("receiver_id", user.id)
            .order("created_at", { ascending: false })
            .limit(15);

        if (cursor) {
            query = query.lt("created_at", cursor);
        }

        const { data: rawData, error } = await query;

        if (error) throw error;
        if (!rawData) return [];

        // تطبيع بيانات الـ actor من مصفوفة إلى كائن واحد
        const data: NotificationItem[] = rawData.map((item: Record<string, unknown>) => ({
            id: item.id as string,
            type: item.type as string,
            post_id: item.post_id as string | null,
            comment_id: item.comment_id as string | null,
            created_at: item.created_at as string,
            is_read: item.is_read as boolean,
            actor: normalizeProfile(item.actor) as NotificationActor | null,
        }));

        return data;
    }, "حدث خطأ في جلب الاشعارات")
}

export async function markNotificationsAsReadAction() {
    return withErrorHandling(async () => {
        const { supabase, user } = await requireUser();

        const { error } = await supabase.from("notifications")
            .update({ is_read: true })
            .eq("receiver_id", user.id)
            .eq("is_read", false);

        if (error) throw error;

        return null
    }, "حدث خطأ في وضع علامة على الإشعار كمقروء")
}