"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getGlobalUnreadCountAction } from "@/features/chat/actions";

interface UnreadBadgeProps {
  currentUserId: string;
}

export default function UnreadBadge({ currentUserId }: UnreadBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    const result = await getGlobalUnreadCountAction();
    if (result.success && typeof result.data === "number") {
      setUnreadCount(result.data);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  useEffect(() => {
    if (!currentUserId) return;

    const supabase = createClient();
    const id = crypto.randomUUID();
    const channel = supabase
      .channel(`messages-unread-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=neq.${currentUserId}`,
        },
        () => {
          loadUnreadCount();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadUnreadCount]);

  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in duration-300">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}
