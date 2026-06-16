import ChatArea from "@/features/chat/components/ChatArea";
import { requireUser } from "@/lib/supabase/server";

export const metadata = {
  title: "Socially | المحادثة",
};

export default async function ConversationPage({ 
  params 
}: { 
  params: Promise<{ conversationId: string }> 
}) {
  const { user } = await requireUser();
  const resolvedParams = await params;

  return (
    <div className="h-full w-full bg-background relative flex flex-col">
      <ChatArea 
        conversationId={resolvedParams.conversationId} 
        currentUserId={user.id} 
      />
    </div>
  );
}