"use client";

import { useConversations } from "../hooks/useChat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/formatDate";
import OnlineDot from "@/features/online/components/OnlineDot";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConversationList() {
  const { data: conversations, isLoading, error } = useConversations();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mb-2 text-primary" />
        <span className="text-sm">جاري تحميل المحادثات...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-destructive bg-destructive/10 rounded-lg m-4">
        حدث خطأ أثناء جلب المحادثات.
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">
          لا توجد محادثات حتى الآن.<br />
          ابدأ بالتواصل مع أصدقائك من ملفاتهم الشخصية!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      {conversations.map((convo) => {
        const participant = convo.participant;
        const fallbackLetter = participant.full_name?.charAt(0).toUpperCase() || "?";
        const isActive = pathname.includes(`/chat/${convo.id}`);

        return (
          <Link
            key={convo.id}
            href={`/chat/${convo.id}`}
            className={cn(
              "flex items-center gap-3 p-3 transition-colors border-b border-border/40 hover:bg-secondary/50",
              isActive ? "bg-secondary/80 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
            )}
          >
            <div className="relative shrink-0">
              <Avatar className="h-12 w-12 border border-border/50 shadow-sm">
                <AvatarImage src={participant.avatar_url || ""} alt={participant.full_name || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {fallbackLetter}
                </AvatarFallback>
              </Avatar>
              <OnlineDot userId={participant.id} />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-[15px] truncate text-foreground">
                  {participant.full_name || "مستخدم مجهول"}
                </h4>
                {convo.lastMessage && (
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap mr-2">
                    {formatRelativeTime(convo.lastMessage.created_at)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[13px] text-muted-foreground truncate w-[85%]">
                  {convo.lastMessage ? (
                    <>
                      {/* لو هو اللي باعت الرسالة نحط "أنت:" قبلها للتمييز السريع */}
                      {convo.lastMessage.sender_id !== participant.id && "أنت: "}
                      {convo.lastMessage.content}
                    </>
                  ) : (
                    <span className="italic">محادثة جديدة</span>
                  )}
                </p>
                
                {/* عدد الرسائل الغير مقروءة */}
                {(convo.unreadCount || 0) > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                    {convo.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}