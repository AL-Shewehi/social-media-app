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
  
  // 1. جلب المستخدم الحالي (عشان نعرف الـ user_id ونحدد الصداقات المسموح لها تشوف البوستات)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. جلب علاقات الصداقة المقبولة وبناء قائمة الـ IDs المسموح بها (أنا + أصدقائي)
  let allowedUserIds: string[] = [];
  if (user) {
    const { data: friendships } = await supabase
      .from("friendships")
      .select("sender_id, receiver_id")
      .eq("status", "accepted")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    const friendIds = friendships?.map((f) =>
      f.sender_id === user.id ? f.receiver_id : f.sender_id
    ) || [];

    allowedUserIds = [user.id, ...friendIds];
  }

  // 3. الفلترة السحرية: جلب المنشورات فقط للأشخاص الموجودين في allowedUserIds
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      id,
      content,
      created_at,
      user_id,
      image_url,
      profiles!posts_user_id_fkey (
        id,
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
    // فقط المنشورات الخاصة بالصداقات المقبولة
    .in("user_id", allowedUserIds.length > 0 ? allowedUserIds : ['00000000-0000-0000-0000-000000000000'])
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

  // إعداد الـ Realtime Subscription مع فلترة الأمان بناءً على allowedUserIds
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
      allowedUserIds={allowedUserIds}
    />
  );
}