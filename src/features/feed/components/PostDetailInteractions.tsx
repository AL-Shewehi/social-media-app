"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleLikeAction, createCommentAction, deletePostAction } from "../actions";
import { feedKeys, postKeys } from "@/lib/query-key-factory";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThumbsUp, MessageCircle, Share2, Trash2, ChevronRight, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatDate";
import { toast } from "sonner";
import type { PostCardPost, Profile } from "@/types/database.types";
import type { InfiniteData } from "@tanstack/react-query";

const LikesDialog = dynamic(() => import("./LikesDialog"), {
  ssr: false,
});

interface PostDetailInteractionsProps {
  post: PostCardPost;
  currentUserId: string;
  currentUserProfile: Profile | null;
  sharedAuthor: Profile | null;
  onShare: () => void;
}

export default function PostDetailInteractions({
  post,
  currentUserId,
  currentUserProfile,
  sharedAuthor,
  onShare,
}: PostDetailInteractionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [isLikesOpen, setIsLikesOpen] = useState(false);

  const author = post.profiles;
  const likesCount = post.likesCount ?? post.likes?.length ?? 0;
  const commentsCount = post.comments?.length ?? 0;
  const displayIsLiked = post.isLikedByMe ?? false;

  const likeMutation = useMutation({
    mutationFn: async () => {
      const result = await toggleLikeAction(post.id);
      if (!result.success) throw new Error(result.error);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: postKeys.detail(post.id) });
      const previous = queryClient.getQueryData<PostCardPost>(postKeys.detail(post.id));
      if (previous) {
        queryClient.setQueryData<PostCardPost>(postKeys.detail(post.id), {
          ...previous,
          isLikedByMe: !previous.isLikedByMe,
          likesCount: previous.isLikedByMe
            ? Math.max(0, (previous.likesCount ?? 0) - 1)
            : (previous.likesCount ?? 0) + 1,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(postKeys.detail(post.id), context.previous);
      }
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const result = await createCommentAction(post.id, content);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: postKeys.detail(post.id) });
      queryClient.getQueryCache().findAll({ queryKey: feedKeys.all }).forEach((q) => {
        queryClient.invalidateQueries({ queryKey: q.queryKey });
      });
    },
    onError: (err) => toast.error(err.message || "حدث خطأ"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const result = await deletePostAction(post.id);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.getQueryCache().findAll({ queryKey: feedKeys.all }).forEach((q) => {
        queryClient.setQueryData<InfiniteData<PostCardPost[]>>(q.queryKey, (old) => {
          if (!old) return old;
          return { ...old, pages: old.pages.map((p) => p.filter((x) => x.id !== post.id)) };
        });
      });
      toast.success("تم حذف المنشور");
      router.push("/");
    },
    onError: (err) => toast.error(err.message || "حدث خطأ"),
  });

  const handleComment = () => {
    if (commentText.trim()) commentMutation.mutate(commentText.trim());
  };

  return (
    <>
    <div className="w-full lg:w-1/2 h-full flex flex-col bg-card">
      {/* Mobile Header */}
      <div className="flex items-center gap-3 px-4 h-14 bg-card border-b shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-9 w-9">
          <ChevronRight className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-base">المنشور</h1>
      </div>

      {/* Author Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.user_id}`}>
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={author?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {author?.full_name?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link href={`/profile/${post.user_id}`} className="font-semibold text-[15px] hover:underline">
              {author?.full_name || "مستخدم"}
            </Link>
            <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(post.created_at)}</p>
          </div>
        </div>
        {post.user_id === currentUserId && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-9 w-9 text-destructive hover:text-destructive"
            onClick={() => deleteMutation.mutate()}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Post Content */}
        {post.content && (
          <div className="px-4 py-3 border-b">
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>
        )}

        {/* Mobile media */}
        {post.image_url && (
          <div className="lg:hidden border-b">
            <img src={post.image_url} alt="" className="w-full max-h-96 object-contain bg-black/5" />
          </div>
        )}

        {/* Mobile shared post */}
        {post.shared_post && (
          <div className="lg:hidden border-b px-4 py-3">
            <div className="bg-secondary/50 rounded-xl p-3 border">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6 border">
                  <AvatarImage src={sharedAuthor?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {sharedAuthor?.full_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">{sharedAuthor?.full_name || "مستخدم"}</span>
              </div>
              {post.shared_post.content && <p className="text-xs text-muted-foreground mb-2">{post.shared_post.content}</p>}
              {post.shared_post.image_url && (
                <img src={post.shared_post.image_url} alt="" className="rounded-lg w-full max-h-60 object-cover" />
              )}
            </div>
          </div>
        )}

        {/* Counts */}
        <div className="flex items-center justify-between px-4 py-2 border-b text-sm text-muted-foreground shrink-0">
          <button
            onClick={() => setIsLikesOpen(true)}
            className="flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <ThumbsUp className={cn("h-4 w-4", displayIsLiked && "fill-primary text-primary")} />
            <span>{likesCount}</span>
          </button>
          <span>{commentsCount} تعليق</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center border-b shrink-0">
          <button
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition rounded-none",
              displayIsLiked
                ? "text-primary hover:text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <ThumbsUp className={cn("h-5 w-5", displayIsLiked && "fill-primary")} />
            إعجاب
          </button>
          <div className="w-px h-6 bg-border" />
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition rounded-none">
            <MessageCircle className="h-5 w-5" />
            تعليق
          </button>
          <div className="w-px h-6 bg-border" />
          <button
            onClick={onShare}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition rounded-none"
          >
            <Share2 className="h-5 w-5" />
            مشاركة
          </button>
        </div>

        {/* Comments */}
        <div className="px-4 py-3 space-y-4">
          {post.comments && post.comments.length > 0 ? (
            post.comments.map((comment) => (
              <div key={comment.id} className="flex gap-2.5">
                <Link href={`/profile/${comment.user_id}`} className="shrink-0">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={comment.profiles?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                      {comment.profiles?.full_name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="bg-secondary/70 rounded-2xl px-3 py-2">
                    <Link href={`/profile/${comment.user_id}`} className="font-semibold text-xs hover:underline">
                      {comment.profiles?.full_name || "مستخدم"}
                    </Link>
                    <p className="text-sm mt-0.5 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 mr-3">
                    {formatRelativeTime(comment.created_at)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground text-sm py-8">لا توجد تعليقات بعد</p>
          )}
        </div>
      </div>

      {/* Comment Form */}
      {currentUserProfile && (
        <div className="border-t px-4 py-3 shrink-0">
          <form onSubmit={(e) => { e.preventDefault(); handleComment(); }} className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border shrink-0">
              <AvatarImage src={currentUserProfile.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                {currentUserProfile.full_name?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="اكتب تعليقاً..."
              className="flex-1 h-10 bg-secondary rounded-full border-none px-4 text-sm"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!commentText.trim() || commentMutation.isPending}
              className="rounded-full h-9 w-9 shrink-0"
            >
              {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      )}
    </div>

      <LikesDialog
        postId={post.id}
        open={isLikesOpen}
        onOpenChange={setIsLikesOpen}
      />
    </>
  );
}
