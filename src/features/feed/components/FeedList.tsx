import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database.types";
import FeedPosts from "./FeedPosts";
import FeedErrorBoundary from "@/components/shared/FeedErrorBoundary";
import { formatPosts, type RawPostData } from "@/lib/formatPosts";
import { POST_SELECT, fetchUserLikedPostIds } from "@/lib/queries/posts";

interface FeedListProps {
  currentUserProfile?: Profile | null;
}

export default async function FeedList({ currentUserProfile }: FeedListProps) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

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
    .select(POST_SELECT)
    .in("user_id", allowedUserIds)
    .order("created_at", { ascending: false })
    .limit(15);

  if (error) {
    console.error("🚨 خطأ أثناء جلب المنشورات:", error.message);
    return (
      <div className="text-center p-8 bg-card rounded-xl border text-destructive text-sm font-medium">
        حدث خطأ أثناء تحميل المنشورات. حاول مرة أخرى لاحقاً.
      </div>
    );
  }

  const postIds = (posts as RawPostData[] | null)?.map(p => p.id) || [];
  const likedPostIds = await fetchUserLikedPostIds(supabase, user.id, postIds);

  const formattedPosts = formatPosts(
    (posts as unknown as RawPostData[]) || [],
    likedPostIds,
  );

  return (
    <FeedErrorBoundary>
      <FeedPosts
        initialPosts={formattedPosts}
        currentUserId={user.id}
        currentUserProfile={currentUserProfile ?? null}
        allowedUserIds={allowedUserIds}
      />
    </FeedErrorBoundary>
  );
}
