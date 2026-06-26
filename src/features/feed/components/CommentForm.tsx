"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createCommentAction } from "@/features/feed/actions";
import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { feedKeys } from "@/lib/query-key-factory";
import type { Profile, PostCardPost } from "@/types/database.types";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface CommentFormProps {
  postId: string;
  user: Profile | null;
}

export default function CommentForm({ postId, user }: CommentFormProps) {
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const fallbackLetter = user?.full_name?.charAt(0).toUpperCase() || "?";

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const result = await createCommentAction(postId, content);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      setCommentText("");

      queryClient
        .getQueryCache()
        .findAll({ queryKey: feedKeys.all })
        .forEach((query) => {
          queryClient.setQueryData<InfiniteData<PostCardPost[]>>(
            query.queryKey,
            (old) => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page) =>
                  page.map((p) => {
                    if (p.id !== postId) return p;
                    return {
                      ...p,
                      commentsCount: p.commentsCount + 1,
                    };
                  })
                ),
              };
            }
          );
        });
      queryClient.refetchQueries({ queryKey: ["post-comments", postId] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "فشل إضافة التعليق"
      );
    },
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || commentMutation.isPending) return;
    commentMutation.mutate(commentText);
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
            disabled={commentMutation.isPending}
            placeholder="اكتب تعليقاً..."
            className=" w-full flex-1 h-9 bg-secondary px-4 pl-10 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
            dir="auto"
          />

          <button
            type="submit"
            disabled={commentMutation.isPending || !commentText.trim()}
            className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="h-5 w-5 text-primary" />
          </button>
        </div>
      </form>
    </div>
  );
}
