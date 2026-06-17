import { normalizeProfile } from "./normalize";
import { PostCardPost } from "@/types/database.types";

export type RawProfileData = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type RawCommentData = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: RawProfileData | RawProfileData[] | null;
};

export type RawSharedPostData = {
  id: string;
  content: string | null;
  image_url: string | null;
  profiles: RawProfileData | RawProfileData[] | null;
};

export type RawPostData = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  image_url: string | null;
  shared_post_id: string | null;
  profiles: RawProfileData | RawProfileData[] | null;
  comments: RawCommentData[] | null;
  likes: { count: number }[] | null;
  shared_post: RawSharedPostData | RawSharedPostData[] | null;
};

export function formatPosts(posts: RawPostData[], likedPostIds: Set<string>): PostCardPost[] {
  return posts.map((post) => {
    // لو البوست ده عبارة عن "مشاركة" لبوست تاني ياخد البوست الأول
    const rawShared = Array.isArray(post.shared_post) ? post.shared_post[0] : post.shared_post;

    return {
      id: post.id,
      content: post.content,
      created_at: post.created_at,
      user_id: post.user_id,
      image_url: post.image_url,
      shared_post_id: post.shared_post_id,
      
      profiles: normalizeProfile(post.profiles),
      
      comments: post.comments?.map((c) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user_id: c.user_id,
        profiles: normalizeProfile(c.profiles),
      })) ?? [],
      
      shared_post: rawShared ? {
          id: rawShared.id,
          content: rawShared.content,
          image_url: rawShared.image_url,
          profiles: normalizeProfile(rawShared.profiles),
      } : null,
      
      likesCount: post.likes?.[0]?.count ?? 0,
      isLikedByMe: likedPostIds.has(post.id),
    };
  });
}