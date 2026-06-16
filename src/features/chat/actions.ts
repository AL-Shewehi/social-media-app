"use server";

import { requireUser } from "@/lib/supabase/server";
import { withErrorHandling } from "@/lib/with-error-handling";
import { normalizeProfile } from "@/lib/normalize";
import type { ChatMessage, ConversationListItem, ChatParticipant } from "@/types/database.types";

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
            return existingConversation.id;
        }

        const {data: newConversation, error: insertError} = await supabase
        .from("conversations")
        .insert({
            user_one_id: userOneId,
            user_two_id: userTwoId,
        })
        .select("id")
        .single();

        if (insertError?.code === "23505") {
            const { data: existing } = await supabase
                .from("conversations")
                .select("id")
                .eq("user_one_id", userOneId)
                .eq("user_two_id", userTwoId)
                .single();
            if (existing) return existing.id;
        }

        if (insertError) throw insertError;

        return newConversation.id;

    }, "Failed to get or create conversation");
}

export async function getConversationsListAction() {
    return withErrorHandling(async () => {
        const {supabase, user} = await requireUser();

        const { data: conversations, error } = await supabase
            .from("conversations")
            .select(`
                id, created_at, user_one_id, user_two_id,
                user_one:user_one_id(id, full_name, avatar_url),
                user_two:user_two_id(id, full_name, avatar_url),
                messages (content, created_at, is_read, sender_id)
            `)
            .or(`user_one_id.eq.${user.id},user_two_id.eq.${user.id}`)
            .order("created_at", { ascending: false });

        if (error) throw error;
        if (!conversations) return [];

        const formattedConversations: ConversationListItem[] = conversations.map((conv) => {
            const participantId = conv.user_one_id === user.id ? conv.user_two_id : conv.user_one_id;
            const rawProfile = conv.user_one_id === user.id ? conv.user_two : conv.user_one;
            const participant = normalizeProfile(rawProfile) as ChatParticipant | null;

            const sortedMessages = [...(conv.messages ?? [])].sort(
                (a: { created_at: string }, b: { created_at: string }) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            const lastMessage = sortedMessages[0] || null;

            const unreadCount = (conv.messages ?? []).filter(
                (msg: { is_read: boolean; sender_id: string }) => !msg.is_read && msg.sender_id !== user.id
            ).length;

            return {
                id: conv.id,
                created_at: conv.created_at,
                participant: participant ?? { id: participantId, full_name: "مستخدم", avatar_url: null },
                lastMessage: lastMessage
                    ? { content: lastMessage.content, created_at: lastMessage.created_at, is_read: lastMessage.is_read, sender_id: lastMessage.sender_id }
                    : null,
                unreadCount,
            };
        });

        formattedConversations.sort((a, b) => {
            const dateA = a.lastMessage?.created_at || a.created_at;
            const dateB = b.lastMessage?.created_at || b.created_at;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });

        return formattedConversations;
    }, "Failed to fetch conversations list");
}

export async function getConversationParticipantAction(conversationId: string) {
    return withErrorHandling(async () => {
        const { supabase, user } = await requireUser();

        const { data: conv, error } = await supabase
            .from("conversations")
            .select("user_one_id, user_two_id")
            .eq("id", conversationId)
            .single();

        if (error) throw error;

        const participantId = conv.user_one_id === user.id ? conv.user_two_id : conv.user_one_id;

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .eq("id", participantId)
            .single();

        if (profileError) throw profileError;

        return profile as ChatParticipant;
    }, "Failed to fetch participant");
}

export async function getChatMessagesAction(conversationId: string, cursor?: string) {
    return withErrorHandling(async () => {
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

        const formattedMessages = (data ?? []).map((msg: Record<string, unknown>) => ({
            id: msg.id as string,
            conversation_id: msg.conversation_id as string,
            sender_id: msg.sender_id as string,
            content: msg.content as string,
            is_read: msg.is_read as boolean,
            created_at: msg.created_at as string,
            sender: Array.isArray(msg.sender) ? (msg.sender as unknown[])[0] : msg.sender,
        })) as ChatMessage[];

        return formattedMessages;
    }, "Failed to fetch messages");
}

export async function sendChatMessageAction(conversationId: string, content: string) {
    return withErrorHandling(async () => {
        const { supabase, user } = await requireUser();

        const { data, error } = await supabase
            .from("messages")
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content: content.trim(),
            })
            .select(`
                id, conversation_id, sender_id, content, is_read, created_at,
                sender:profiles!messages_sender_id_fkey (id, full_name, avatar_url)
            `)
            .single();

        if (error) throw error;

        await supabase
            .from("conversations")
            .update({ created_at: new Date().toISOString() })
            .eq("id", conversationId);

        return {
            id: data.id,
            conversation_id: data.conversation_id,
            sender_id: data.sender_id,
            content: data.content,
            is_read: data.is_read,
            created_at: data.created_at,
            sender: Array.isArray(data.sender) ? (data.sender as unknown[])[0] : data.sender,
        } as ChatMessage;
    }, "Failed to send message");
}

export async function markMessagesAsReadAction(conversationId: string) {
    return withErrorHandling(async () => {
        const { supabase, user } = await requireUser();

        const { error } = await supabase
            .from("messages")
            .update({ is_read: true })
            .eq("conversation_id", conversationId)
            .neq("sender_id", user.id)
            .eq("is_read", false);

        if (error) throw error;

        return null;
    }, "Failed to mark messages as read");
}
