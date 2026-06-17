"use client";

import ConversationList from "@/features/chat/components/ConversationList";
import ChatArea from "@/features/chat/components/ChatArea";
import { Card } from "@/components/ui/card";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChatConversationShell({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const pathname = usePathname();
  const isChatActive = pathname !== "/chat";

  return (
    <div className="h-dvh lg:h-screen">
      <Card className="flex flex-row h-full w-full overflow-hidden border-0 lg:border shadow-sm bg-card rounded-none gap-0 p-0">
        <div
          className={cn(
            "w-full md:w-[320px] lg:w-95 border-l-0 md:border-l border-border/50 flex-col bg-secondary/10 shrink-0",
            isChatActive ? "hidden md:flex" : "flex",
          )}
        >
          <div className="px-4 border-b border-border bg-card shrink-0 h-14 sticky top-0 z-10 flex items-center gap-2">
            <Link href="/chat">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <h2 className="text-lg font-bold">الرسائل</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <ConversationList />
          </div>
        </div>

        <div
          className={cn(
            "flex-1 flex-col bg-background/50 relative min-w-0",
            isChatActive ? "flex" : "hidden md:flex",
          )}
        >
          <ChatArea
            conversationId={conversationId}
            currentUserId={currentUserId}
          />
        </div>
      </Card>
    </div>
  );
}
