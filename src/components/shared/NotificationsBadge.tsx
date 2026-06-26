"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface NotificationsBadgeProps {
  currentUserId: string;
  onFetchNotifications: () => Promise<{
    success: boolean;
    data?: { is_read: boolean }[];
    error?: string;
  }>;
}

export default function NotificationsBadge({ currentUserId, onFetchNotifications }: NotificationsBadgeProps) {
  const [count, setCount] = useState(0);

  const loadCount = useCallback(async () => {
    const result = await onFetchNotifications();
    if (result.success && result.data) {
      setCount(result.data.filter((n) => !n.is_read).length);
    }
  }, [onFetchNotifications]);

  useEffect(() => {
    loadCount();
  }, [loadCount]);

  useEffect(() => {
    if (!currentUserId) return;

    const supabase = createClient();
    const id = crypto.randomUUID();
    const channel = supabase
      .channel(`notifications-badge-${id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `receiver_id=eq.${currentUserId}`,
      }, () => {
        loadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadCount]);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in duration-300">
      {count > 9 ? "+9" : count}
    </span>
  );
}
