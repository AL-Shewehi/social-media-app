import { requireUser } from "@/features/auth/actions";
import { getProfile } from "@/lib/supabase/server";
import CreatePost from "@/features/feed/components/CreatePost";
import FeedList from "@/features/feed/components/FeedList";

export default async function HomePage() {
  const { user } = await requireUser();
  const profile = await getProfile(user.id);

  return (
    <div>
      <CreatePost user={profile} />
      <FeedList currentUserProfile={profile} />
    </div>
  );
}
