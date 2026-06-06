"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Comment } from "@/types/database.types";

interface CommentItemProps {
  comment: Comment;
}

export default function CommentItem({ comment }: CommentItemProps) {
  const cAuthor = comment.profiles?.full_name || "مستخدم مجهول";
  const fallbackLetter = cAuthor.charAt(0).toUpperCase();

  return (
    <div className="flex items-start gap-2 text-right">
      <Avatar className="h-8 w-8 border mt-0.5">
        <AvatarFallback className="bg-neutral-500 text-white font-bold text-xs">
          {fallbackLetter}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col max-w-[85%]">
        <div className="bg-secondary px-3 py-2 rounded-2xl">
          <h5 className="font-semibold text-xs text-foreground hover:underline cursor-pointer">
            {cAuthor}
          </h5>
          <p
            className="text-[13px] text-foreground mt-0.5 leading-relaxed wrap-break-word"
            dir="auto"
          >
            {comment.content}
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground px-2 mt-0.5">
          {new Date(comment.created_at).toLocaleTimeString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
