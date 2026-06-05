import { createServerSupabaseClient } from "@/lib/supabase/server";
import PostCard from "./PostCard";

export default async function FeedList() {
  const supabase = await createServerSupabaseClient()
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
    id,
    content,
    created_at,
    user_id,
    profiles!posts_user_id_fkey (
      full_name,
      avatar_url
    ),
    comments (
      id,
      content,
      created_at,
      user_id,
      profiles (
        full_name,
        avatar_url
      )
    ),
    likes (
      post_id,
      user_id
    )
  `)
    .order("created_at", { ascending: false })
    .order("created_at", { referencedTable: "comments", ascending: true });
  if (error) {
    console.error("خطأ أثناء جلب المنشورات:", error.message);
    return (
      <div className="text-center p-8 bg-card rounded-xl border text-red-500 text-sm">
        حدث خطأ أثناء تحميل المنشورات. حاول مرة أخرى لاحقاً.
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-4">
      {posts && posts.length > 0 ? (
        posts.map((post) => {
          const formattedPost = {
            ...post,
            profiles: Array.isArray(post.profiles)
              ? post.profiles[0] || null
              : (post.profiles as any)
          };

          return (
            <PostCard
              key={post.id}
              post={formattedPost}
              currentUserId={user?.id}
            />
          );
        })
      ) : (
        <div className="text-center p-8 bg-card rounded-xl border text-muted-foreground text-sm">
          لا توجد منشورات بعد. كن أول من ينشر! ✍️
        </div>
      )}
    </div>
  )

}
