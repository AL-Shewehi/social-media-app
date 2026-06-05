export type PostCardProps = {
  currentUserId?: string;
  post: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: { full_name: string | null; avatar_url: string | null } | null;
    comments: any[] | null;
    likes: { post_id: string; user_id: string }[] | null;
  };
}

export type CommentData = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}


export type Profile = {
  full_name: string | null;
  avatar_url: string | null;
};

export type Post = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: Profile | null;
  comments: Comment[] | null;
  likes: Like[] | null;
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
