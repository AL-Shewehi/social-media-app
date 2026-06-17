"use client";

import { useChatMessages, useConversationParticipant } from "../hooks/useChat";
import MessageInput from "./MessageInput";
import { useEffect, useRef } from "react";
import { Loader2, ArrowRight, Check, CheckCheck } from "lucide-react";
import { formatRelativeTime } from "@/lib/formatDate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import OnlineDot from "@/features/online/components/OnlineDot";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { markMessagesAsReadAction } from "../actions";
import { useQueryClient } from "@tanstack/react-query";
import { chatKeys } from "@/lib/query-key-factory";
import type { ConversationListItem } from "@/types/database.types";

export default function ChatArea({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const {
    messages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useChatMessages(conversationId, currentUserId);
  const { data: participant } = useConversationParticipant(conversationId);
  const queryClient = useQueryClient();

  const loadMoreRef = useRef<HTMLDivElement>(null);

  //  جعل الرسائل مقروءة عند فتح الشات
  useEffect(() => {
    if (conversationId) {
      queryClient.setQueryData<ConversationListItem[]>(["conversations"], (old) => {
        if (!old) return old;
        return old.map((convo) =>
          convo.id === conversationId ? { ...convo, unreadCount: 0 } : convo,
        );
      });

      // إرسال طلب التحديث للسيرفر
      markMessagesAsReadAction(conversationId).then(() => {
        // تأكيد التحديث من السيرفر
        queryClient.invalidateQueries({ queryKey: chatKeys.conversations });
      });
    }
  }, [conversationId, queryClient]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage)
          fetchNextPage();
      },
      { rootMargin: "200px" },
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col h-full w-full bg-[url('/chat-pattern.png')] bg-repeat bg-center">
      {/* Header */}
      <div className="h-14 border-b border-border/50 bg-card/95 backdrop-blur-sm flex items-center px-4 gap-3 shrink-0 z-10">
        <Link
          href="/chat"
          className="md:hidden p-2 -mr-2 text-muted-foreground hover:bg-secondary rounded-full transition"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
        {participant ? (
          <>
            <Link href={`/profile/${participant.id}`} className="flex items-center gap-3">
              <div className="relative shrink-0">
                <Avatar className="h-10 w-10 border border-border/50 shadow-sm">
                  <AvatarImage src={participant.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {participant.full_name?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <OnlineDot userId={participant.id} />
              </div>
              <div className="font-semibold text-[15px]">
                {participant.full_name}
              </div>
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary animate-pulse" />
            <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto flex flex-col-reverse p-4 gap-3">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex w-full",
                    isMe ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] md:max-w-[65%] p-3 shadow-sm flex flex-col",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-bl-sm"
                        : "bg-secondary text-secondary-foreground rounded-2xl rounded-br-sm",
                    )}
                  >
                    <p
                      className="text-[14.5px] leading-relaxed whitespace-pre-wrap wrap-break-word"
                      dir="auto"
                    >
                      {msg.content}
                    </p>

                    {/* وقت الرسالة + حالة القراءة */}
                    <div
                      className={cn(
                        "flex items-center gap-1 mt-1 opacity-70",
                        isMe ? "justify-end" : "justify-start",
                      )}
                    >
                      <span className="text-[10px]">
                        {formatRelativeTime(msg.created_at)}
                      </span>
                      {isMe &&
                        (msg.is_read ? (
                          <CheckCheck className="h-3.5 w-3.5 " />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
            <div
              ref={loadMoreRef}
              className="h-4 w-full flex items-center justify-center py-2"
            >
              {isFetchingNextPage && (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </div>
          </>
        )}
      </div>
      <MessageInput conversationId={conversationId} />
    </div>
  );
}
