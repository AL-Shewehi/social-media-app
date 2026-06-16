"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Heart, MessageCircle, UserPlus, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/formatDate";
import { fetchNotificationsAction, markNotificationsAsReadAction } from "@/features/notifications/actions";
import type { NotificationItem } from "@/components/shared/NotificationsDropdown";
import Link from "next/link";

const getNotificationDetails = (type: string) => {
  switch (type) {
    case "like":
      return { icon: <Heart className="h-4 w-4 text-primary" />, text: "أعجب بمنشورك" };
    case "comment":
      return { icon: <MessageCircle className="h-4 w-4 text-green-500" />, text: "علق على منشورك" };
    case "friend_request":
      return { icon: <UserPlus className="h-4 w-4 text-blue-500" />, text: "أرسل لك طلب صداقة" };
    case "share":
      return { icon: <Share2 className="h-4 w-4 text-purple-500" />, text: "شارك منشورك" };
    default:
      return { icon: <Bell className="h-4 w-4 text-muted-foreground" />, text: "تفاعل معك" };
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    const result = await fetchNotificationsAction();
    if (result.success && result.data) {
      setNotifications(result.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();
    createClient().auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setCurrentUserId(data.session.user.id);
      }
    });
  }, [loadNotifications]);

  useEffect(() => {
    markNotificationsAsReadAction();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();
    const channel = supabase
      .channel("notifications-page-channel")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `receiver_id=eq.${currentUserId}`,
      }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadNotifications, currentUserId]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border/50 z-10">
        <div className="flex items-center gap-3 px-4 h-14">
          <h1 className="font-bold text-lg">الإشعارات</h1>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            جاري التحميل...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mb-3">
              <Bell className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">لا توجد إشعارات حتى الآن</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {notifications.map((notification) => {
              const details = getNotificationDetails(notification.type);
              const actor = notification.actor;
              const linkTarget = notification.post_id
                ? `/post/${notification.post_id}`
                : actor?.id
                  ? `/profile/${actor.id}`
                  : "#";

              return (
                <Link
                  key={notification.id}
                  href={linkTarget}
                  onClick={(e) => linkTarget === "#" && e.preventDefault()}
                  className={`flex items-start gap-3 px-4 py-3 transition hover:bg-secondary/50 ${
                    !notification.is_read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-11 w-11 border">
                      <AvatarImage src={actor?.avatar_url ?? undefined} />
                      <AvatarFallback>
                        {actor?.full_name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                      {details.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-tight">
                      <span className="font-semibold">
                        {actor?.full_name || "مستخدم غير معروف"}
                      </span>{" "}
                      {details.text}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
