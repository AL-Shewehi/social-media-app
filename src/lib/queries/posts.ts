export const POST_SELECT = `
  id, content, created_at, user_id, image_url, shared_post_id,
  profiles!posts_user_id_fkey (id, full_name, avatar_url),
  comments (id, content, created_at, user_id, profiles (id, full_name, avatar_url)),
  likes (count),
  shared_post:shared_post_id (
    id, content, image_url,
    profiles:profiles!posts_user_id_fkey (id, full_name, avatar_url)
  )
`;

export async function fetchUserLikedPostIds(
  supabase: ReturnType<typeof import("@supabase/ssr").createServerClient>,
  userId: string,
  postIds: string[],
): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();

  const { data: userLikes } = await supabase
    .from("likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  return new Set(userLikes?.map((l: { post_id: string }) => l.post_id) || []);
}

export async function fetchBrowserUserLikedPostIds(
  supabase: ReturnType<typeof import("@supabase/ssr").createBrowserClient>,
  userId: string,
  postIds: string[],
): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();

  const { data: userLikes } = await supabase
    .from("likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  return new Set(userLikes?.map((l: { post_id: string }) => l.post_id) || []);
}
