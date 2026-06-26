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


export type PostCardPost = Omit<Post, 'likes' | 'shared_post' | 'comments'> & {
  likesCount?: number;
  isLikedByMe?: boolean;
  likes?: Like[] | null;
  shared_post: SharedPost | null;
  commentsCount: number;
  comments?: Comment[] | null;
};

export type PostCardProps = {
  currentUserId?: string;
  currentUserProfile?: Profile | null;
  post: PostCardPost;
  priority?: boolean;
};


export interface ChatParticipant {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: ChatParticipant | null;
}

// يعكس هيكل جدول conversations في قاعدة البيانات
export interface ConversationRow {
  id: string;
  created_at: string;
  user_one_id: string;
  user_two_id: string;
  user_one_unread_count: number;
  user_two_unread_count: number;
}

export interface ConversationListItem {
  id: string;
  created_at: string;
  participant: ChatParticipant;
  lastMessage?: {
    content: string;
    created_at: string;
    is_read: boolean;
    sender_id: string;
  } | null;
  unreadCount: number;
}