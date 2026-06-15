"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Heart, MessageCircle, UserPlus, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/formatDate";
import Link from "next/link";

export interface NotificationActor {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface NotificationItem {
  id: string;
  type: "like" | "comment" | "friend_request" | "share" | string;
  post_id?: string | null;
  created_at: string;
  is_read: boolean;
  actor: NotificationActor | null;
}

interface NotificationsDropdownProps {
  currentUserId: string;
  onFetchNotifications: () => Promise<{
    success: boolean;
    data?: NotificationItem[];
    error?: string;
  }>;
  onMarkAsRead: () => Promise<{ success: boolean; error?: string }>;
}

export default function NotificationsDropdown({
  currentUserId,
  onFetchNotifications,
  onMarkAsRead,
}: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    const result = await onFetchNotifications();
    if (result.success && result.data) {
      setNotifications(result.data);
      setUnreadCount(result.data.filter((n) => !n.is_read).length);
    }
  }, [onFetchNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("notifications-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        () => {
          loadNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadNotifications]);

  const handleOpenChange = async (isOpen: boolean) => {
    if (isOpen && unreadCount > 0) {
      setUnreadCount(0);
      await onMarkAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  const getNotificationDetails = (type: string) => {
    switch (type) {
      case "like":
        return {
          icon: <Heart className="h-4 w-4 text-primary" />,
          text: "أعجب بمنشورك",
        };
      case "comment":
        return {
          icon: <MessageCircle className="h-4 w-4 text-green-500" />,
          text: "علق على منشورك",
        };
      case "friend_request":
        return {
          icon: <UserPlus className="h-4 w-4 text-blue-500" />,
          text: "أرسل لك طلب صداقة",
        };
      case "share":
        return {
          icon: <Share2 className="h-4 w-4 text-purple-500" />,
          text: "شارك منشورك",
        };
      default:
        return {
          icon: <Bell className="h-4 w-4 text-muted-foreground" />,
          text: "تفاعل معك",
        };
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full h-10 w-10 bg-secondary hover:bg-secondary/80 transition relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
              {unreadCount > 9 ? "+9" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 p-2 rounded-xl bg-card border shadow-xl"
      >
        <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b">
          <h3 className="font-bold text-lg text-foreground">الإشعارات</h3>
        </div>

        <div className="max-h-100 overflow-y-auto scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              لا توجد إشعارات حتى الآن 📭
            </div>
          ) : (
            notifications.map((notification) => {
              const details = getNotificationDetails(notification.type);
              const actor = notification.actor;
              
              //  تحديد الرابط بشكل آمن لضمان عدم ظهور undefined
              const linkTarget = notification.post_id
                ? `/post/${notification.post_id}`
                : actor?.id 
                  ? `/profile/${actor.id}` 
                  : "#";

              return (
                <DropdownMenuItem
                  key={notification.id}
                  asChild
                  className="p-2 cursor-pointer rounded-lg mb-1 focus:bg-secondary"
                >
                  <Link
                    href={linkTarget}
                    // منع التنقل إذا كان الرابط غير صالح (مثل "#") لتجنب تجربة مستخدم سيئة
                    onClick={(e) => linkTarget === "#" && e.preventDefault()}
                    className="flex items-start gap-3 w-full"
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={actor?.avatar_url || undefined} />
                        <AvatarFallback>
                          {actor?.full_name?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                        {details.icon}
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-foreground leading-tight">
                        <span className="font-semibold">
                          {actor?.full_name || "مستخدم غير معروف"}
                        </span>{" "}
                        {details.text}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                    )}
                  </Link>
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}