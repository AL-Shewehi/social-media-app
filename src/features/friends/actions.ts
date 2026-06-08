"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/actions";

export async function sendFriendRequestAction(receiverId: string) {
    try {
        const {supabase, user} = await requireUser();

        const {data: existing} = await supabase
        .from("friendships")
        .select("id")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`) // تحقق إذا كان هناك طلب صداقة موجود بالفعل بين المستخدمين
        .maybeSingle();

        if (existing) {
            throw new Error("طلب الصداقة موجود بالفعل بين المستخدمين.");
        }

        const { error } = await supabase.from("friendships").insert({
            sender_id: user.id,
            receiver_id: receiverId,
            status: "pending",
        });

        if (error) throw error;

        revalidatePath(`/profile/${receiverId}`);
        return { success: true };
    } catch (error: unknown) {
        console.error("sendFriendRequestAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "حدث خطأ أثناء إرسال طلب الصداقة",
        };
    }
}

export async function acceptFriendRequestAction(friendshipId: string, senderId: string) {
    try {
        const {supabase, user} = await requireUser();

        const { error } = await supabase.from("friendships").update({
            status: "accepted",
            updated_at: new Date().toISOString(),
        })
        .eq("id", friendshipId)
        .eq("receiver_id", user.id);

        if (error) throw error;

        revalidatePath(`/profile/${senderId}`);
        return { success: true };
    } catch (error: unknown) {
        console.error("acceptFriendRequestAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "حدث خطأ أثناء قبول طلب الصداقة",
        };
    }
}

export async function cancelOrRemoveFriendshipAction(friendshipId: string, targetUserId: string) {
    try {
        const {supabase, user} = await requireUser();

        const { error } = await supabase
        .from("friendships")
      .delete()
      .eq("id", friendshipId)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`); // تأكد أن المستخدم هو إما المرسل أو المستقبل للطلب

        if (error) throw error;

        revalidatePath(`/profile/${targetUserId}`);
        return { success: true };
    } catch (error: unknown) {
        console.error("cancelOrRemoveFriendAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "حدث خطأ أثناء إلغاء أو إزالة الصداقة",
        };
    }
}