"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { withErrorHandling } from "@/lib/with-error-handling";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUUID(id: string, errorMessage: string) {
    if (!id || !UUID_REGEX.test(id)) {
        throw new Error(errorMessage);
    }
}

export async function sendFriendRequestAction(targetUserId: string) {
    return withErrorHandling(async () => {
        //  التحقق من صحة معرف المستخدم المستهدف
        validateUUID(targetUserId, "معرف المستخدم المستهدف غير صالح.");

        const { supabase, user } = await requireUser();

        // منع المستخدم من إرسال طلب صداقة لنفسه
        if (user.id === targetUserId) {
            throw new Error("لا يمكنك إرسال طلب صداقة إلى نفسك.");
        }

        //  إرسال طلب الصداقة في جدول الصداقات
        const { data: friendship, error } = await supabase.from("friendships").insert([{
            sender_id: user.id,
            receiver_id: targetUserId,
            status: "pending"
        }]).select().single();

        if (error) throw error;

        //  إرسال إشعار للشخص الثاني
        const { error: notifError } = await supabase.from("notifications").insert([{
            receiver_id: targetUserId,
            actor_id: user.id,
            type: 'friend_request'
        }]);

        if (notifError) {
            console.error("🚨 خطأ في تسجيل إشعار طلب الصداقة:", notifError);
        }

        revalidatePath(`/profile/${targetUserId}`);
        return friendship;
    }, "فشل إرسال طلب الصداقة");
}

export async function acceptFriendRequestAction(friendshipId: string, senderId: string) {
    return withErrorHandling(async () => {
        //  التحقق من صحة المعرفات
        validateUUID(friendshipId, "معرف الصداقة غير صالح.");
        validateUUID(senderId, "معرف المرسل غير صالح.");

        const { supabase, user } = await requireUser();

        // تحديث حالة الصداقة إلى "مقبول"
        const { error } = await supabase.from("friendships").update({
            status: "accepted",
            updated_at: new Date().toISOString(),
        })
        .eq("id", friendshipId)
        .eq("receiver_id", user.id);

        if (error) throw error;

        //  إرسال إشعار قبول الصداقة
        const { error: notifError } = await supabase.from("notifications").insert([{
            receiver_id: senderId,
            actor_id: user.id,
            type: 'friend_accept'
        }]);

        if (notifError) {
            console.error("🚨 خطأ في تسجيل إشعار قبول الصداقة:", notifError);
        }

        revalidatePath(`/profile/${senderId}`);
        return null;
    }, "حدث خطأ أثناء قبول طلب الصداقة. حاول مرة أخرى.");
}

export async function cancelOrRemoveFriendshipAction(friendshipId: string, targetUserId: string) {
    return withErrorHandling(async () => {
        // التحقق من صحة المعرفات
        validateUUID(friendshipId, "معرف الصداقة غير صالح.");
        validateUUID(targetUserId, "معرف المستخدم المستهدف غير صالح.");

        const { supabase, user } = await requireUser();

        // مسح علاقة الصداقة
        const { error } = await supabase.from("friendships")
            .delete()
            .eq("id", friendshipId)
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        if (error) throw error;

        // مسح الإشعار المرتبط بطلب الصداقة
        const { error: deleteNotifError } = await supabase.from("notifications")
            .delete()
            .eq("receiver_id", targetUserId)
            .eq("actor_id", user.id)
            .eq("type", 'friend_request');

        if (deleteNotifError) {
            console.error("🚨 خطأ في حذف إشعار طلب الصداقة:", deleteNotifError);
        }

        revalidatePath(`/profile/${targetUserId}`);
        return null;
    }, "فشل إلغاء أو حذف الصداقة");
}

export async function getSuggestedFriendsAction(limitCount: number = 5) {
    return withErrorHandling(async () => {
        const { supabase, user } = await requireUser();

        const { data: friendships, error: friendshipsError } = await supabase
            .from("friendships")
            .select("sender_id, receiver_id")
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        if (friendshipsError) throw friendshipsError;

        const excludedIds = new Set<string>([user.id]);
        friendships?.forEach((f) => {
            excludedIds.add(f.sender_id);
            excludedIds.add(f.receiver_id);
        });

        const excludedIdsString = `(${Array.from(excludedIds).map(id => `"${id}"`).join(",")})`;

        const { data: suggestions, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .not("id", "in", excludedIdsString)
            .limit(limitCount);

        if (profilesError) throw profilesError;

        return suggestions;
    }, "حدث خطأ أثناء جلب اقتراحات الأصدقاء");
}