"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Comment } from "@/types/database.types";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/formatDate";

interface CommentItemProps {
  comment: Comment;
}

export default function CommentItem({ comment }: CommentItemProps) {
  const cAuthor = comment.profiles?.full_name || "مستخدم مجهول";
  const fallbackLetter = cAuthor.charAt(0).toUpperCase();

  return (
    <div className="flex items-start gap-2 text-right">
      <Link href={`/profile/${comment.user_id}`}>
        <Avatar className="h-8 w-8 border mt-0.5 hover:opacity-80 transition cursor-pointer">
          {comment.profiles?.avatar_url && (
            <AvatarImage src={comment.profiles.avatar_url} alt={cAuthor} />
          )}
          <AvatarFallback className="bg-neutral-500 text-white font-bold text-xs">
            {fallbackLetter}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex flex-col max-w-[85%]">
        <div className="bg-secondary px-3 py-2 rounded-2xl">
          <Link 
            href={`/profile/${comment.user_id}`} 
            className="font-semibold text-xs text-foreground hover:underline cursor-pointer block"
          >
            {cAuthor}
          </Link>
          <p
            className="text-[13px] text-foreground mt-0.5 leading-relaxed wrap-break-word"
            dir="auto"
          >
            {comment.content}
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground px-2 mt-0.5">
          {formatRelativeTime(comment.created_at)}
        </span>
      </div>
    </div>
  );
}