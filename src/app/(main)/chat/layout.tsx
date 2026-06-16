"use client"; // مهم جداً عشان نقدر نستخدم usePathname

import ConversationList from "@/features/chat/components/ConversationList";
import { Card } from "@/components/ui/card";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isChatActive = pathname !== "/chat";

  return (
    <div className="container max-w-6xl mx-auto h-[calc(100vh-100px)] md:h-[calc(100vh-60px)]">
      <Card className="flex flex-row h-full w-full overflow-hidden border shadow-sm bg-card rounded-none gap-0 p-0">
        
        <div 
          className={cn(
            "w-full md:w-[320px] lg:w-95 border-l-0 md:border-l border-border/50 flex-col bg-secondary/10 shrink-0",
            // في الموبايل: لو فاتح شات اخفي القائمة، لو مش فاتح اعرضها
            isChatActive ? "hidden md:flex" : "flex"
          )}
        >
          <div className="px-4 border-b border-border bg-card shrink-0 h-14 sticky top-0 z-10 flex items-center">

            <h2 className="text-lg font-bold">الرسائل</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <ConversationList />
          </div>
        </div>

        <div 
          className={cn(
            "flex-1 flex-col bg-background/50 relative min-w-0",
            // في الموبايل: لو فاتح شات اعرضه، لو مش فاتح اخفيه
            isChatActive ? "flex" : "hidden md:flex"
          )}
        >
          {children}
        </div>

      </Card>
    </div>
  );
}