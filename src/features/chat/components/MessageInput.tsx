"use client";

import { useState } from "react";
import { useSendMessage } from "../hooks/useChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";

export default function MessageInput({ conversationId }: { conversationId: string }) {
  const [content, setContent] = useState("");
  const sendMessage = useSendMessage();

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || sendMessage.isPending) return;

    sendMessage.mutate(
      { conversationId, content },
      {
        onSuccess: () => setContent(""), // تفريغ الحقل بعد الإرسال بنجاح
      }
    );
  };

  return (
    <form 
      onSubmit={handleSend} 
      className="p-4 bg-card border-t border-border/50 flex items-center gap-2 shrink-0"
    >
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="اكتب رسالتك..."
        className="flex-1 bg-secondary/30 border-secondary focus-visible:ring-1 rounded-full px-5 h-11"
        dir="auto"
        autoComplete="off"
      />
      <Button
        type="submit"
        disabled={!content.trim() || sendMessage.isPending}
        className="rounded-full w-11 h-11 p-0 flex items-center justify-center shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
      >
        {sendMessage.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5 rtl:-scale-x-100" />
        )}
      </Button>
    </form>
  );
}