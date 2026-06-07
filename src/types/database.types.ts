export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: Profile | null;
};

export type Like = {
  post_id: string;
  user_id: string;
};

export type Post = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: Profile | null;
  comments: Comment[] | null;
  likes: Like[] | null;
  image_url: string | null;
};

export type PostCardProps = {
  currentUserId?: string;
  currentUserProfile?: Profile | null;
  post: Post;
};
