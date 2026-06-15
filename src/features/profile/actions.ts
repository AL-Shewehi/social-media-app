"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { withErrorHandling } from "@/lib/with-error-handling";
import { formatPosts } from "@/lib/formatPosts";


export async function getProfilePageData(profileUserId: string) {
  try {
    const { supabase, user } = await requireUser();

    //  جلب بيانات صاحب البروفايل
    const { data: targetProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", profileUserId)
      .single();

    if (profileError || !targetProfile) {
      return { error: "هذا الحساب غير موجود أو تم حذفه." };
    }

    //  جلب المنشورات بكامل تفاصيلها
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select(`
        id, content, created_at, user_id, image_url, shared_post_id,
        profiles!posts_user_id_fkey (id, full_name, avatar_url),
        comments (id, content, created_at, user_id, profiles (id, full_name, avatar_url)),
        likes (count),
        shared_post:shared_post_id (id, content, image_url, profiles:profiles!posts_user_id_fkey (id, full_name, avatar_url))
      `)
      .eq("user_id", profileUserId)
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Posts fetch error:", postsError.message);
      return { error: "حدث خطأ في جلب المنشورات." };
    }

    //  استعلام علاقة الصداقة)
    const { data: friendshipData } = await supabase
      .from("friendships")
      .select("id, sender_id, receiver_id, status")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${profileUserId}),and(sender_id.eq.${profileUserId},receiver_id.eq.${user.id})`)
      .maybeSingle();

    // جلب إعجابات المستخدم الحالي وتنسيق المنشورات
    const postIds = posts?.map((p) => p.id) || [];
    let likedPostIds = new Set<string>();

    if (postIds.length > 0) {
      const { data: userLikes } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds);

      likedPostIds = new Set(userLikes?.map((l) => l.post_id) || []);
    }

    const formattedPosts = formatPosts(posts ?? [], likedPostIds);
    const isMyOwnProfile = user.id === profileUserId;

    return {
      targetProfile,
      formattedPosts,
      friendshipData,
      isMyOwnProfile,
      currentUser: user,
      error: null,
    };

  } catch (err) {
    console.error("Profile Data Error:", err);
    return { error: "حدث خطأ غير متوقع أثناء تحميل الملف الشخصي." };
  }
}

export async function updateProfileAction(fullName: string) {
    return withErrorHandling(async () => {
        const cleanName = fullName ? fullName.trim() : "";

        if (!cleanName || cleanName.length < 3) {
            throw new Error("الاسم الكامل يجب أن يكون على الأقل 3 أحرف");
        }

        if (cleanName.length > 100) {
            throw new Error("الاسم الكامل طويل جداً. الحد الأقصى هو 100 حرف");
        }

        const { supabase, user } = await requireUser();

        const { error } = await supabase
            .from("profiles")
            .update({ 
                full_name: cleanName, 
                updated_at: new Date().toISOString() 
            })
            .eq("id", user.id);

        if (error) throw error;

        revalidatePath("/");
        return null;
    }, "حدث خطأ أثناء تحديث الملف الشخصي");
}

export async function updateAvatarAction(avatarUrl: string) {
    return withErrorHandling(async () => {
        if (!avatarUrl) {
            throw new Error("رابط الصورة غير صالح");
        }

        const { supabase, user } = await requireUser();

        const { error } = await supabase
            .from("profiles")
            .update({ 
                avatar_url: avatarUrl, 
                updated_at: new Date().toISOString() 
            })
            .eq("id", user.id);

        if (error) throw error;

        revalidatePath("/");
        return null;
    }, "حدث خطأ أثناء تحديث الصورة الشخصية");
}



