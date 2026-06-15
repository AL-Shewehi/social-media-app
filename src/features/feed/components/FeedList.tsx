import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database.types";
import RealtimeFeedList from "./RealtimeFeedList";
import FeedErrorBoundary from "@/components/shared/FeedErrorBoundary";
import { formatPosts, type RawPostData } from "@/lib/formatPosts";

interface FeedListProps {
  currentUserProfile?: Profile | null;
}

export default async function FeedList({ currentUserProfile }: FeedListProps) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  //  لو مفيش يوزر أو حصل خطأ، نوقف هنا ونعرض رسالة
  if (authError || !user) {
    console.error("🚨 خطأ في المصادقة داخل FeedList:", authError?.message);
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border text-center space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          غير مصرح بالدخول
        </h3>
        <p className="text-sm text-muted-foreground">
          يرجى تسجيل الدخول أو إعادة تحديث الصفحة لرؤية المنشورات.
        </p>
      </div>
    );
  }

  const { data: friendships } = await supabase
    .from("friendships")
    .select("sender_id, receiver_id")
    .eq("status", "accepted")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  const friendIds =
    friendships?.map((f) =>
      f.sender_id === user.id ? f.receiver_id : f.sender_id,
    ) || [];

  const allowedUserIds = [user.id, ...friendIds];

  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      `
  id,
  content,
  created_at,
  user_id,
  image_url,
  shared_post_id,
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
      id,
      full_name,
      avatar_url
    )
  ),
  likes (count),
  shared_post:shared_post_id (
    id,
    content,
    image_url,
    profiles:profiles!posts_user_id_fkey (
      id,
      full_name,
      avatar_url
    )
  )
`,
    )
    .in("user_id", allowedUserIds)
    .order("created_at", { ascending: false })
    .order("created_at", { referencedTable: "comments", ascending: true })
    .limit(15);

  if (error) {
    console.error("🚨 خطأ أثناء جلب المنشورات:", error.message);
    return (
      <div className="text-center p-8 bg-card rounded-xl border text-destructive text-sm font-medium">
        حدث خطأ أثناء تحميل المنشورات. حاول مرة أخرى لاحقاً.
      </div>
    );
  }

  //   معرفات البوستات اللي "أنا" عملتلها لايك فقط
  const postIds = posts?.map((p) => p.id) || [];
  let likedPostIds = new Set<string>();

  if (postIds.length > 0) {
    const { data: userLikes, error: likesError } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds);

    if (likesError) {
      console.error("🚨 خطأ أثناء جلب إعجابات المستخدم:", likesError.message);
    } else {
      likedPostIds = new Set(userLikes?.map((l) => l.post_id) || []);
    }
  }

const formattedPosts = formatPosts((posts as unknown as RawPostData[]) || [], likedPostIds);
  return (
    <FeedErrorBoundary>
      <RealtimeFeedList
        initialPosts={formattedPosts}
        currentUserId={user.id}
        currentUserProfile={currentUserProfile ?? null}
        allowedUserIds={allowedUserIds}
      />
    </FeedErrorBoundary>
  );
}
