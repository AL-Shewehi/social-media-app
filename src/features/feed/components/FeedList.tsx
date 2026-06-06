import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database.types";
import RealtimeFeedList from "./RealtimeFeedList";

interface FeedListProps {
  currentUserProfile?: Profile | null;
}

function normalizeProfile(profiles: unknown): Profile | null {
  if (!profiles) return null;
  if (Array.isArray(profiles)) return (profiles[0] as Profile) ?? null;
  return profiles as Profile;
}

export default async function FeedList({ currentUserProfile }: FeedListProps) {
  const supabase = await createServerSupabaseClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      id,
      content,
      created_at,
      user_id,
      image_url,
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ─── تسوية وتنظيف البيانات بالكامل في السيرفر ───
  const formattedPosts = posts?.map((post) => ({
    ...post,
    profiles: normalizeProfile(post.profiles),
    comments: (post.comments as any[])?.map((c) => ({
      ...c,
      profiles: normalizeProfile(c.profiles),
    })) ?? [],
    likes: (post.likes as any[]) ?? [],
  })) ?? [];

  return (
    <RealtimeFeedList
      initialPosts={formattedPosts}
      currentUserId={user?.id ?? ""}
      currentUserProfile={currentUserProfile ?? null}
    />
  );
}