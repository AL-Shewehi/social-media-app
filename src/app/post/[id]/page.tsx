import { requireUser, getProfile } from "@/lib/supabase/server";
import { fetchSinglePostAction } from "@/features/feed/actions";
import PostDetailPage from "@/features/feed/components/PostDetailPage";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();
  const profile = await getProfile(user.id);

  let initialPost = null;
  try {
    const result = await fetchSinglePostAction(id);
    if (result.success) initialPost = result.data ?? null;
  } catch {
    // ignore
  }

  return (
    <PostDetailPage
      initialPost={initialPost}
      currentUserId={user.id}
      currentUserProfile={profile}
    />
  );
}
