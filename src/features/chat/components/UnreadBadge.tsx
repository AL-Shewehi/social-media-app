"use client";

import { useConversations } from "../hooks/useChat";

export default function UnreadBadge() {
  const { data: conversations, isLoading } = useConversations();

  const totalUnread = conversations?.reduce(
    (sum, convo) => sum + (convo.unreadCount || 0),
    0
  ) || 0;

  if (isLoading || totalUnread === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in duration-300">
      {totalUnread > 99 ? "99+" : totalUnread}
    </span>
  );
}