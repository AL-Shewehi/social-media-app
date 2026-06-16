"use server";

import { requireUser } from "@/lib/supabase/server";
import { withErrorHandling } from "@/lib/with-error-handling";
import { ChatMessage, ConversationListItem } from "@/types/database.types";

export async function getOrCreateConversationAction(targetUserId: string) {
    return withErrorHandling(async () => {
        const {supabase, user} = await requireUser();

        const userOneId = user.id < targetUserId ? user.id : targetUserId;
        const userTwoId = user.id < targetUserId ? targetUserId : user.id;

        const {data:existingConversation, error: searchError} = await supabase
        .from("conversations")
        .select("id")
        .eq("user_one_id", userOneId)
        .eq("user_two_id", userTwoId)
        .maybeSingle();

        if (searchError) throw searchError;

        if (existingConversation) {
            return {success: true, conversationId: existingConversation.id};
        }

        const {data: newConversation, error: insertError} = await supabase
        .from("conversations")
        .insert({
            user_one_id: userOneId,
            user_two_id: userTwoId,
        })
        .select("id")
        .single();

        if (insertError) throw insertError;

        return {success: true, conversationId: newConversation.id};

    }, "Failed to get or create conversation");
}

export async function getConversationsListAction() {
    return withErrorHandling(async () => {
        const {supabase, user} = await requireUser();

        const {data: conversations, error} = await supabase
        .from("conversations")
        .select(`id, created_at, user_one_id, user_two_id,
    messages (content, created_at, is_read, sender_id)`)
        .or(`user_one_id.eq.${user.id},user_two_id.eq.${user.id}`)
        .order("created_at", {ascending: false});

        if (error) throw error;

        const formattedConversations: ConversationListItem[] = await Promise.all(
            conversations.map(async (conv) => {
                const participantId = conv.user_one_id === user.id ? conv.user_two_id : conv.user_one_id;

                const {data: participantProfile, error: profileError} = await supabase
                .from("profiles")
                .select("id, full_name, avatar_url")
                .eq("id", participantId)
                .maybeSingle();

                if (profileError) throw profileError;

                const sortedMessages = conv.messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                const lastMessage = sortedMessages[0] || null;

                const unreadCount = conv.messages?.filter(
                  (msg) => !msg.is_read && msg.sender_id !== user.id
                ).length || 0;

                return {
                    id: conv.id,
                    created_at: conv.created_at,
                    participant: participantProfile || {id: participantId, full_name: "مستخدم", avatar_url: null},
                    lastMessage: lastMessage,
                    unreadCount: unreadCount,
                }
            })
        )

        formattedConversations.sort((a, b) => {
            const dateA = a.lastMessage?.created_at || a.created_at;
            const dateB = b.lastMessage?.created_at || b.created_at;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        })

        return {success: true, conversations: formattedConversations};
    }, "Failed to fetch conversations list");
}

// استرجاع رسائل المحادثة
export async function getChatMessagesAction(conversationId: string, cursor?: string) {
  try {
    const { supabase } = await requireUser();
    const PAGE_SIZE = 20;

    let query = supabase
      .from("messages")
      .select(`
        id, conversation_id, sender_id, content, is_read, created_at,
        sender:profiles!messages_sender_id_fkey (id, full_name, avatar_url)
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Format the messages to match the ChatMessage type, ensuring sender is an object not an array
    const formattedMessages: ChatMessage[] = (data as any[]).map((msg) => ({
      id: msg.id,
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      content: msg.content,
      is_read: msg.is_read,
      created_at: msg.created_at,
      sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender,
    }));

    return { success: true, data: formattedMessages };
  } catch (error: any) {
    console.error("Fetch Messages Error:", error.message);
    return { success: false, error: "فشل في جلب الرسائل" };
  }
}

// ─── 4. إرسال رسالة ───
export async function sendChatMessageAction(conversationId: string, content: string) {
  try {
    const { supabase, user } = await requireUser();

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim()
      })
      .select(`
        id, conversation_id, sender_id, content, is_read, created_at,
        sender:profiles!messages_sender_id_fkey (id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // تحديث وقت المحادثة عشان تطلع فوق في القائمة
    await supabase
      .from("conversations")
      .update({ created_at: new Date().toISOString() })
      .eq("id", conversationId);

    const formattedMessage: ChatMessage = {
      id: data.id,
      conversation_id: data.conversation_id,
      sender_id: data.sender_id,
      content: data.content,
      is_read: data.is_read,
      created_at: data.created_at,
      sender: Array.isArray(data.sender) ? data.sender[0] : data.sender,
    };

    return { success: true, data: formattedMessage };
  } catch (error: any) {
    console.error("Send Message Error:", error.message);
    return { success: false, error: "فشل إرسال الرسالة" };
  }
}

export async function markMessagesAsReadAction(conversationId: string) {
  return withErrorHandling(async () => {
    const { supabase, user } = await requireUser();

    const {error} = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id) // تحديث كل الرسائل الغير مقروءة من الطرف الآخر
    .eq("is_read", false);

    if (error) throw error;

    return { success: true };
  }, "Failed to mark messages as read");
}