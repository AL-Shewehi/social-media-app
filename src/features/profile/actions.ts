"use server";

import {revalidatePath} from "next/cache";
import { requireUser } from "../auth/actions";

export async function updateProfileAction(fullName: string) {
    try {
        if (!fullName.trim() || fullName.length < 3) {
            throw new Error("الاسم الكامل يجب أن يكون على الأقل 3 أحرف");
        }

        const {supabase, user} = await requireUser();

        const {error} = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
        .eq("id", user.id)

        if (error) throw error;

        revalidatePath("/");
        return { success: true };
    } catch (error: unknown) {
        console.error("Error updating profile:", error);
        return { success: false, error: error instanceof Error ? error.message : "حدث خطأ غير معروف" };
    }
}

export async function updateAvatarAction(avatarUrl: string) {
    try {
        if (!avatarUrl) {
            throw new Error("رابط الصورة غير صالح");
        }

        const {supabase, user} = await requireUser();

        const {error} = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id)

        if (error) throw error;

        revalidatePath("/");
        return { success: true };
    } catch (error: unknown) {
        console.error("Error updating avatar:", error);
        return { success: false, error: error instanceof Error ? error.message : "حدث خطأ غير معروف" };
    }
}