"use client"

import { InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getChatMessagesAction, getConversationsListAction, getConversationParticipantAction, sendChatMessageAction } from "../actions"
import { ChatMessage, ConversationListItem, ChatParticipant } from "@/types/database.types"
import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const result = await getConversationsListAction();
      if (!result.success) throw new Error(result.error);
      return result.data as ConversationListItem[];
    },
    staleTime: 5 * 60 * 1000, // 5 دقائق
  });
}

export function useConversationParticipant(conversationId: string) {
  return useQuery({
    queryKey: ["conversation-participant", conversationId],
    queryFn: async () => {
      const result = await getConversationParticipantAction(conversationId);
      if (!result.success) throw new Error(result.error);
      return result.data as ChatParticipant;
    },
    enabled: !!conversationId,
  });
}

export function useChatMessages(conversationId: string, currentUserId: string) {
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
      return lastPage[lastPage.length - 1].created_at;
    },
    enabled: !!conversationId,
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

          const { data: fullMessage } = await supabase
            .from("messages")
            .select(`
              id, conversation_id, sender_id, content, is_read, created_at,
              sender:profiles!messages_sender_id_fkey (id, full_name, avatar_url)`)
            .eq("id", payload.new.id)
            .single();

          if (!fullMessage) return;

          const formattedMessage = {
            id: fullMessage.id,
            conversation_id: fullMessage.conversation_id,
            sender_id: fullMessage.sender_id,
            content: fullMessage.content,
            is_read: fullMessage.is_read,
            created_at: fullMessage.created_at,
            sender: Array.isArray(fullMessage.sender) ? (fullMessage.sender as unknown[])[0] : fullMessage.sender,
          } as ChatMessage;

          queryClient.setQueryData<InfiniteData<ChatMessage[]>>(queryKey, (oldData) => {
            if (!oldData) return oldData;

            const alreadyExists = oldData.pages.some((page) =>
              page.some((msg) => msg.id === formattedMessage.id)
            );
            if (alreadyExists) return oldData;

            return {
              ...oldData,
              pages: [[formattedMessage, ...oldData.pages[0]], ...oldData.pages.slice(1)],
            };
          });

          queryClient.setQueryData<ConversationListItem[]>(["conversations"], (oldConversations) => {
            if (!oldConversations) return oldConversations;

            return oldConversations
              .map((conversation) => {
                if (conversation.id !== conversationId) return conversation;

                const incomingDate = new Date(formattedMessage.created_at);
                const currentLastDate = conversation.lastMessage?.created_at
                  ? new Date(conversation.lastMessage.created_at)
                  : null;

                return {
                  ...conversation,
                  lastMessage: !currentLastDate || incomingDate > currentLastDate
                    ? { content: formattedMessage.content, created_at: formattedMessage.created_at, is_read: formattedMessage.is_read, sender_id: formattedMessage.sender_id }
                    : conversation.lastMessage,
                  created_at: incomingDate > new Date(conversation.created_at)
                    ? formattedMessage.created_at
                    : conversation.created_at,
                  unreadCount: formattedMessage.sender_id !== currentUserId
                    ? (conversation.unreadCount || 0) + 1
                    : conversation.unreadCount,
                };
              })
              .sort((a, b) => {
                const dateA = a.lastMessage?.created_at || a.created_at;
                const dateB = b.lastMessage?.created_at || b.created_at;
                return new Date(dateB).getTime() - new Date(dateA).getTime();
              });
          });
        }
      )

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
  }, [queryClient, conversationId, currentUserId]);

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
