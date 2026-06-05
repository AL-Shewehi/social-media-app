"use server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { requireUser } from "../auth/actions";



export async function createPostAction(content: string) {
    try {
       const { supabase, user } = await requireUser();

        const { data, error } = await supabase.from("posts").insert([{
            user_id: user.id,
            content: content.trim()
        }]).select().single()

        if (error) throw error
        revalidatePath("/")
        return { success: true, data }
    } catch (error: unknown) {
        console.error("createPostAction error:", error)
        return { success: false, error: "حدث خطأ أثناء نشر المنشور" }
    }
}

export async function createCommentAction(postId: string, content: string) {
    try {
        const { supabase, user } = await requireUser();


        const { data, error } = await supabase.from("comments").insert([{
            post_id: postId,
            user_id: user.id,
            content: content.trim()
        }]).select().single()

        if (error) throw error

        revalidatePath('/');
        return { success: true, data }
    } catch (error: unknown) {
        console.error("createCommentAction error:", error)
        return { success: false, error: error instanceof Error ? error.message : "حدث خطأ أثناء إضافة التعليق" }
    }
}

export async function toggleLikeAction(postId: string) {
    try {
       const { supabase, user } = await requireUser();

        const { data: existingLike, error: checkError } = await supabase
            .from("likes")
            .select("*")
            .eq("post_id", postId)
            .eq("user_id", user.id)
            .maybeSingle();
        if (checkError) throw checkError

        if (existingLike) {
            const { error: deleteError } = await supabase.from("likes").delete()
                .eq("post_id", postId)
                .eq("user_id", user.id)

            if (deleteError) throw deleteError
        } else {
            const { error: insertError } = await supabase.from("likes").insert([{
                post_id: postId,
                user_id: user.id
            }])

            if (insertError) throw insertError
        }

        revalidatePath("/")
        return { success: true, isLiked: !existingLike }

    } catch (error: unknown) {
        console.error("toggleLikeAction error:", error)
        return { success: false, error: error instanceof Error ? error.message : "حدث خطأ أثناء الإعجاب بالمنشور" }
    }
}