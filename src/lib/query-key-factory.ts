export const feedKeys = {
  all: ["feed"] as const,
  list: (allowedIds: string) => ["feed", "all", allowedIds] as const,
  profile: (userId: string) => ["feed", "profile", userId] as const,
};

export const postKeys = {
  detail: (id: string) => ["post", id] as const,
};

export const chatKeys = {
  conversations: ["conversations"] as const,
  messages: (id: string) => ["chat-messages", id] as const,
  participant: (id: string) => ["conversation-participant", id] as const,
};

export const likeKeys = {
  list: (postId: string) => ["likes", postId] as const,
};

export const friendKeys = {
  ids: ["friend-ids"] as const,
};

export const notificationKeys = {
  list: ["notifications"] as const,
};
