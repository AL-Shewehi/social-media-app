import { Suspense } from "react";
import { requireUser, getProfile } from "@/lib/supabase/server";
import CreatePost from "@/features/feed/components/CreatePost";
import FeedList from "@/features/feed/components/FeedList";
import PostCardSkeleton from "@/features/feed/components/PostCardSkeleton";

export default async function HomePage() {
  const { user } = await requireUser();
  const profile = await getProfile(user.id);

  return (
    <div className="space-y-4">
      <CreatePost user={profile} />
      
      <Suspense
        fallback={
          <div className="space-y-4">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        }
      >
        <FeedList currentUserProfile={profile} />
      </Suspense>
    </div>
  );
}