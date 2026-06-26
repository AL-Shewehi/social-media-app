"use client";

import { useQuery } from "@tanstack/react-query";
import { useUIStore } from "@/store/useUIStore";
import { fetchSinglePostAction, fetchPostCommentsAction } from "../actions";
import { postKeys } from "@/lib/query-key-factory";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Loader2 } from "lucide-react";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import type { PostCardPost, Comment } from "@/types/database.types";
import { formatRelativeTime } from "@/lib/formatDate";
import { linkifyText } from "@/lib/linkify";

export default function GlobalPostModal() {
  const { isPostModalOpen, selectedPostId, closePostModal, currentUserProfile } = useUIStore();

  const { data: post, isLoading: isPostLoading } = useQuery({
    queryKey: postKeys.detail(selectedPostId ?? ""),
    queryFn: async () => {
      const result = await fetchSinglePostAction(selectedPostId!);
      if (!result.success) throw new Error(result.error);
      return result.data as PostCardPost;
    },
    enabled: isPostModalOpen && !!selectedPostId,
    staleTime: 1000 * 60 * 2,
  });

  const { data: comments = [], isLoading: isCommentsLoading } = useQuery({
    queryKey: ["post-comments", selectedPostId],
    queryFn: () =>
      fetchPostCommentsAction(selectedPostId!).then((r) => {
        if (!r.success) throw new Error(r.error);
        return r.data as Comment[];
      }),
    enabled: isPostModalOpen && !!selectedPostId,
    staleTime: 1000 * 60 * 2,
  });

  const authorName = post?.profiles?.full_name || "مستخدم مجهول";
  const fallbackLetter = authorName.charAt(0).toUpperCase();

  return (
    <Dialog open={isPostModalOpen} onOpenChange={(open) => !open && closePostModal()}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-card border border-border rounded-xl flex flex-col max-h-[85vh]">
        <DialogHeader className="p-4 border-b flex items-center justify-center">
          <DialogTitle className="text-center font-bold text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span>منشور {authorName}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            عرض تفاصيل منشور {authorName}
          </DialogDescription>
        </DialogHeader>

        {isPostLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : post ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex gap-3 bg-secondary/30 p-3 rounded-lg border border-border/50">
                <Avatar className="h-9 w-9 border">
                  <AvatarFallback className="bg-primary text-white font-bold text-xs">
                    {fallbackLetter}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-semibold text-sm">{authorName}</h5>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(post.created_at)}
                    </span>
                  </div>
                  <p
                    className="text-[14px] text-foreground mt-1 wrap-break-word"
                    dir="auto"
                  >
                    {linkifyText(post.content)}
                  </p>
                </div>
              </div>

              {post.image_url && (
                <div className="w-full border-t border-b border-border/50 bg-secondary/20 flex items-center justify-center max-h-[500px] overflow-hidden">
                  <img
                    src={post.image_url}
                    alt="Post media"
                    className="w-full h-full object-cover max-h-[500px] transition hover:brightness-95 duration-200"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="border-t border-border/60 my-2" />

              <div className="space-y-3">
                {isCommentsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    لا توجد تعليقات بعد
                  </div>
                )}
              </div>
            </div>

            <CommentForm postId={post.id} user={currentUserProfile} />
          </>
        ) : (
          <div className="flex justify-center py-12 text-muted-foreground">
            المنشور غير موجود أو تم حذفه
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
