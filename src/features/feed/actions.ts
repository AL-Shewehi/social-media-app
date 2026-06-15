"use server"
import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/supabase/server";
import { withErrorHandling } from "@/lib/with-error-handling";
import { normalizeProfile } from "@/lib/normalize";
import { formatPosts } from "@/lib/formatPosts";



export async function createPostAction(content: string, imageUrl?: string | null, sharedPostId?: string | null) {
  return withErrorHandling(async () => {
    const { supabase, user } = await requireUser();
    
    const cleanContent = content ? content.trim() : "";
    
    if (!cleanContent && !imageUrl && !sharedPostId) {
        throw new Error("لا يمكن نشر منشور فارغ. أضف نصاً أو صورة.");
    }

    if (cleanContent.length > 5000) {
        throw new Error("محتوى المنشور طويل جداً. الحد الأقصى هو 5000 حرف.");
    }

    const { data, error } = await supabase.from("posts").insert([{
        user_id: user.id,
        content: cleanContent,
        image_url: imageUrl || null,
        shared_post_id: sharedPostId || null
    }]).select().single();

    if (error) throw error;
    revalidatePath("/");
    return data;
  }, "حدث خطأ أثناء نشر المنشور");
}



export async function deletePostAction(postId: string) {
    return withErrorHandling(async () => {
        const { supabase, user } = await requireUser();

        const { data: post, error: fetchError } = await supabase
            .from("posts")
            .select("image_url")
            .eq("id", postId)
            .eq("user_id", user.id)
            .single();

        if (fetchError) throw fetchError;

        if (post?.image_url) {
            const urlParts = post.image_url.split('/public/post_images/');
            if (urlParts.length === 2) {
                const filePath = urlParts[1];
                const { error: storageError } = await supabase
                    .storage
                    .from("post_images")
                    .remove([filePath]);
                
                if (storageError) {
                    console.error("فشل حذف الصورة من الـ Storage:", storageError);
                } else {
                    console.log("✅ تم حذف الصورة بنجاح من الـ Bucket!");
                }
            }
        }

        const { error } = await supabase
            .from("posts")
            .delete()
            .eq("id", postId)
            .eq("user_id", user.id);
            
        if (error) throw error;
        
        revalidatePath("/");
        return null;
    }, "فشل حذف المنشور");
}

export async function createCommentAction(postId: string, content: string) {
   return withErrorHandling(async () => {
        const { supabase, user } = await requireUser();

        const cleanContent = content ? content.trim() : "";

        if (!cleanContent) {
            throw new Error("لا يمكن إضافة تعليق فارغ.");
        }

        if (cleanContent.length > 1000) {
            throw new Error("التعليق طويل جداً. الحد الأقصى هو 1000 حرف.");
        }

        const { data: comment, error } = await supabase.from("comments").insert([{
            post_id: postId,
            user_id: user.id,
            content: cleanContent,
        }]).select().single();
        if (error) throw error;
        
        const {data: post, error: postError} = await supabase.from("posts").select("user_id").eq("id", postId).single();
        if (postError) {
          console.error("خطأ في جلب صاحب البوست لإشعار التعليق:", postError);
        } else if (post && post.user_id !== user.id) {
          const { error: notifError } = await supabase.from("notifications").insert([{
            receiver_id: post.user_id,
            actor_id: user.id,
            type: "comment",
            post_id: postId,
            comment_id: comment.id
          }]);
          if (notifError) {
            console.error("فشل إضافة إشعار التعليق:", notifError);
          }
        }

        revalidatePath("/");
        return comment;
    }, "فشل إضافة التعليق");
}

export async function toggleLikeAction(postId: string) {
   return withErrorHandling(async () => {
        const { supabase, user } = await requireUser();

        const { error: insertError } = await supabase.from("likes").insert([{
            post_id: postId,
            user_id: user.id
        }]);

        if (!insertError) {
            const { data: post, error: postError } = await supabase
                .from("posts")
                .select("user_id")
                .eq("id", postId)
                .single();

            if (postError) {
                console.error("خطأ في جلب صاحب البوست للإشعار:", postError);
            } else if (post && post.user_id !== user.id) {
                const { error: notifError } = await supabase.from("notifications").insert([{
                    receiver_id: post.user_id,
                    actor_id: user.id,
                    type: 'like',
                    post_id: postId
                }]);
                if (notifError) {
                    console.error("فشل إضافة إشعار الإعجاب:", notifError);
                }
            }

            revalidatePath("/");
            return { isLiked: true };
        } 
        
        if (insertError.code === '23505') {
            const { error: deleteError } = await supabase.from("likes").delete()
                .eq("post_id", postId)
                .eq("user_id", user.id);
                
            if (deleteError) throw deleteError;

            const { error: delNotifError } = await supabase.from("notifications").delete()
                .eq("type", "like")
                .eq("post_id", postId)
                .eq("actor_id", user.id);
                
            if (delNotifError) {
              console.error("فشل حذف إشعار الإعجاب:", delNotifError);
            }

            revalidatePath("/");
            return { isLiked: false };
        }

        throw insertError;

    }, "حدث خطأ أثناء تسجيل الإعجاب");
}


export async function fetchPostLikesAction(postId: string) {
  return withErrorHandling(async () => {
    const { supabase } = await requireUser();
    
    const { data, error } = await supabase
      .from("likes")
      .select(`
        user_id,
        profiles!likes_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("post_id", postId);

    if (error) {
      console.error("Supabase Error Details:", error);
      throw error;
    }

    if (!data || data.length === 0) return [];

    return data.map((like) => ({
      id: `${postId}_${like.user_id}`, 
      profile: normalizeProfile(like.profiles),
    }));
  }, "فشل جلب قائمة الإعجابات");
}


export async function fetchMorePostsAction(cursor: string | undefined, allowedUserIds: string[]) {
  return withErrorHandling(async () => {
    const { supabase, user } = await requireUser();
    
    const pageSize = 15;

    let query = supabase
      .from("posts")
      .select(`
        id, content, created_at, user_id, image_url, shared_post_id,
        profiles!posts_user_id_fkey (id, full_name, avatar_url),
        comments (id, content, created_at, user_id, profiles (id, full_name, avatar_url)),
        likes (count),
        shared_post:posts!shared_post_id (
          id, content, image_url,
          profiles!posts_user_id_fkey (id, full_name, avatar_url)
        )
      `)
      .in("user_id", allowedUserIds.length > 0 ? allowedUserIds : ['00000000-0000-0000-0000-000000000000'])
      .order("created_at", { ascending: false })
      .order("created_at", { referencedTable: "comments", ascending: true })
      .limit(pageSize);

    //  Cursor-based pagination: نجلب البوستات الأقدم من التاريخ الممرر
    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: posts, error } = await query;

    if (error) throw error;

    const postIds = posts?.map(p => p.id) || [];
    let likedPostIds = new Set<string>();

    if (postIds.length > 0) {
      const { data: userLikes } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds);
      likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);
    }

        const formattedPosts = formatPosts(posts || [], likedPostIds);


    return formattedPosts;
  }, "فشل جلب المزيد من المنشورات");
}
