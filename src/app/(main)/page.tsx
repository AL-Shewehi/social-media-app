import { requireUser } from "@/features/auth/actions";
import CreatePost from "@/features/feed/components/CreatePost";
import FeedList from "@/features/feed/components/FeedList";

export default async function HomePage() {
   const { supabase, user } = await requireUser();
  
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();
  
  return (
    <div>
      <CreatePost user={profile} />
      <FeedList />
    </div>
  );
}
