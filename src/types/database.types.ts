// Profiles Types
export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

// Comments Types
export type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: Profile | null;
};

// Likes Types
export type Like = {
  post_id: string;
  user_id: string;
};

// Posts Types
export type SharedPost = {
  id: string;
  content: string | null;
  image_url: string | null;
  profiles: Profile | Profile[] | null;
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
  shared_post_id: string | null;
  shared_post: SharedPost | SharedPost[] | null;
};


export type PostCardPost = Omit<Post, 'likes'> & {
  likesCount?: number;
  isLikedByMe?: boolean;
  likes?: Like[] | null;
};

export type PostCardProps = {
  currentUserId?: string;
  currentUserProfile?: Profile | null;
  post: PostCardPost;
  priority?: boolean;
};

// Notifications Types
export type NotificationType = 'like' | 'comment' | 'friend_request' | 'friend_accept' | 'share';

export type AppNotification = {
  id: string;
  created_at: string;
  receiver_id: string;
  actor_id: string;
  type: NotificationType;
  post_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  actor_profile?: Profile; 
};