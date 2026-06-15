"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createCommentAction } from "@/features/feed/actions";
import { toast } from "sonner";
import { Send } from "lucide-react";
import type { Profile } from "@/types/database.types";

interface CommentFormProps {
  postId: string;
  user: Profile | null;
}

export default function CommentForm({ postId, user }: CommentFormProps) {
  const [commentText, setCommentText] = useState("");
  const [isPending, setIsPending] = useState(false);

  const fallbackLetter = user?.full_name?.charAt(0).toUpperCase() || "?";

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isPending) return;

    setIsPending(true);
    const result = await createCommentAction(postId, commentText);
    setIsPending(false);

    if (result.success) {
      setCommentText("");
    } else {
      toast.error(result.error || "فشل إضافة التعليق");
    }
  };

  return (
    <div className="p-3 border-t border-border bg-background">
      <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
        <Avatar className="h-8 w-8 border">
          <AvatarFallback className="bg-primary text-white font-bold text-xs">
            {fallbackLetter}
          </AvatarFallback>
        </Avatar>
        <div className="relative w-full">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={isPending}
            placeholder="اكتب تعليقاً..."
            className=" w-full flex-1 h-9 bg-secondary px-4 pl-10 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
            dir="auto"
          />

          <button
            type="submit"
            disabled={isPending || !commentText.trim()}
            className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="h-5 w-5 text-primary" />
          </button>
        </div>
      </form>
    </div>
  );
}
