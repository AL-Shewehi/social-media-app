"use client"

import { InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getChatMessagesAction, getConversationsListAction, sendChatMessageAction } from "../actions"
import { ChatMessage, ConversationListItem } from "@/types/database.types"
import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// ─── 1. جلب قائمة المحادثات ───
export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const result = await getConversationsListAction();
      
      if (!result.success) throw new Error(result.error);
      
      const anyResult = result as any;
      const list = anyResult.conversations || anyResult.data?.conversations || anyResult.data;
      
      return list as ConversationListItem[];
    },
  });
}

export function useChatMessages(conversationId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["chat-messages", conversationId];

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const result = await getChatMessagesAction(conversationId, pageParam as string | undefined);
      if (!result.success) throw new Error(result.error);
      return result.data as ChatMessage[];
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < 20) return undefined;
      return lastPage[lastPage.length - 1].created_at; // الـ Cursor للصفحة الجاية
    },
    enabled: !!conversationId, // لا تعمل الـ Query إلا لو فيه ID للمحادثة
  });

  useEffect(() => {
    if (!conversationId) return;
    let isMounted = true;
    const supabase = createClient();

    const channel = supabase
      .channel(`chat-${conversationId}`)
      
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          if (!isMounted) return;

          // جلب بيانات المُرسل
          const { data: fullMessage } = await supabase
            .from("messages")
            .select(`
              id, conversation_id, sender_id, content, is_read, created_at,
              sender:profiles!messages_sender_id_fkey (id, full_name, avatar_url)`)
            .eq("id", payload.new.id)
            .single();

          if (!fullMessage) return;

          const formattedMessage: ChatMessage = {
            id: fullMessage.id,
            conversation_id: fullMessage.conversation_id,
            sender_id: fullMessage.sender_id,
            content: fullMessage.content,
            is_read: fullMessage.is_read,
            created_at: fullMessage.created_at,
            sender: Array.isArray(fullMessage.sender) ? fullMessage.sender[0] : fullMessage.sender,
          };

          // تحديث كاش الرسائل
          queryClient.setQueryData<InfiniteData<ChatMessage[]>>(queryKey, (oldData) => {
            if (!oldData) return oldData;

            const alreadyExists = oldData.pages.some((page) => {
              return page.some((msg) => msg.id === formattedMessage.id);
            });

            if (alreadyExists) return oldData;

            return {
              ...oldData,
              pages: [[formattedMessage, ...oldData.pages[0]], ...oldData.pages.slice(1)],
            };
          });

          // تحديث كاش القائمة الجانبية (Conversations)
          queryClient.setQueryData<ConversationListItem[]>(["conversations"], (oldConversations) => {
            if (!oldConversations) return oldConversations;

            return oldConversations.map((conversation) => {
              if (conversation.id === conversationId) {
                return {
                  ...conversation,
                  lastMessage: formattedMessage,
                  created_at: formattedMessage.created_at,
                  unreadCount: (conversation.unreadCount || 0) + 1,
                };
              }
              return conversation;
            }).sort((a, b) => {
              const dateA = a.lastMessage?.created_at || a.created_at;
              const dateB = b.lastMessage?.created_at || b.created_at;
              return new Date(dateB).getTime() - new Date(dateA).getTime();
            });
          });
        }
      )
      
      // ⚡ 2. الاستماع لحدث تحديث الرسالة (UPDATE) - عشان علامة الصح
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (!isMounted) return;

          // تحديث حالة الرسالة في الكاش (مثلاً: قلبها من غير مقروءة لمقروءة)
          queryClient.setQueryData<InfiniteData<ChatMessage[]>>(queryKey, (oldData) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              pages: oldData.pages.map((page) =>
                page.map((m) => (m.id === payload.new.id ? { ...m, is_read: payload.new.is_read } : m))
              ),
            };
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [queryClient, conversationId, queryKey]);

  const messages = data?.pages.flat() || [];

  return {
    messages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  };

}


export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const result = await sendChatMessageAction(conversationId, content);
      if (!result.success) throw new Error(result.error);
      return result.data as ChatMessage;
    },
    onSuccess: (newMessage, { conversationId }) => {
      queryClient.setQueryData<InfiniteData<ChatMessage[]>>(["chat-messages", conversationId], (old) => {
        if (!old) return old;
        const alreadyExists = old.pages.some(page => page.some(m => m.id === newMessage.id));
        if (alreadyExists) return old;
        return {
          ...old,
          pages: [[newMessage, ...old.pages[0]], ...old.pages.slice(1)],
        };
      });
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء إرسال الرسالة");
    },
  });
}