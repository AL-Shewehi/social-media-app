import ChatConversationShell from "./ChatConversationShell";
import { requireUser } from "@/lib/supabase/server";

export const metadata = {
  title: "Socially | المحادثة",
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>,
}) {
  const { user } = await requireUser();
  const { conversationId } = await params;

  return (
    <ChatConversationShell
      conversationId={conversationId}
      currentUserId={user.id}
    />
  );
}
