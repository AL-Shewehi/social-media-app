"use client";
import dynamic from "next/dynamic";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Globe,
  Bookmark,
  Trash2,
} from "lucide-react";
import { type PostCardProps, type PostCardPost } from "@/types/database.types";
import { useState } from "react";
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { feedKeys } from "@/lib/query-key-factory";
import { toggleLikeAction, deletePostAction } from "@/features/feed/actions";
import { toast } from "sonner";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/formatDate";
import { motion, AnimatePresence } from "framer-motion";
import CreatePostDialog from "./CreatePostDialog";
import Image from "next/image";
const CommentsDialog = dynamic(() => import("./CommentsDialog"), {
  ssr: false,
});

const LikesDialog = dynamic(() => import("./LikesDialog"), {
  ssr: false,
});

const DeletePostDialog = dynamic(() => import("./DeletePostDialog"), {
  ssr: false,
});

export default function PostCard({
  post,
  currentUserId,
  currentUserProfile,
  priority = false,
}: PostCardProps) {
  const queryClient = useQueryClient();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLikesOpen, setIsLikesOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const sharedPostId = post.shared_post_id;

  const rawSharedPost = post.shared_post;
  const sharedPost = Array.isArray(rawSharedPost)
    ? rawSharedPost[0]
    : rawSharedPost;

  const sharedProfile = Array.isArray(sharedPost?.profiles)
    ? sharedPost.profiles[0]
    : sharedPost?.profiles;

  const displayLikesCount = post.likesCount ?? post.likes?.length ?? 0;
  const displayIsLikedByMe =
    post.isLikedByMe ??
    (post.likes?.some((like) => like.user_id === currentUserId) || false);

  const formattedDate = formatRelativeTime(post.created_at);
  const authorName = post.profiles?.full_name || "مستخدم مجهول";
  const avatar_url = post.profiles?.avatar_url || "";
  const fallbackLetter = authorName.charAt(0).toUpperCase();
  const isOwnPost = post.user_id === currentUserId;

  const profileHref = post.profiles?.id ? `/profile/${post.profiles.id}` : "#";
  const sharedProfileHref = sharedProfile?.id
    ? `/profile/${sharedProfile.id}`
    : "#";

  const likeMutation = useMutation({
    mutationFn: toggleLikeAction,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.all });
      const previousQueries = queryClient
        .getQueryCache()
        .findAll({ queryKey: feedKeys.all })
        .map(
          (q) => [q.queryKey, queryClient.getQueryData(q.queryKey)] as const,
        );

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
                    const newIsLiked = !p.isLikedByMe;
                    return {
                      ...p,
                      isLikedByMe: newIsLiked,
                      likesCount: (p.likesCount ?? 0) + (newIsLiked ? 1 : -1),
                    };
                  }),
                ),
              };
            },
          );
        });

      return { previousQueries };
    },
    onError: (_err, _postId, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          if (data) queryClient.setQueryData(key, data);
        }
      }
      toast.error("فشل تعديل الإعجاب");
    },
  });

  const handleLikeToggle = () => {
    if (likeMutation.isPending) return;
    likeMutation.mutate(post.id);
  };

  const handleDelete = () => {
    deleteMutation.mutate(post.id);
  };

  const deleteMutation = useMutation({
    mutationFn: deletePostAction,
    onSuccess: (_data) => {
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
                  page.filter((p) => p.id !== post.id),
                ),
              };
            },
          );
        });
      toast.success("تم حذف المنشور بنجاح");
      setIsDeleteOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "فشل حذف المنشور");
    },
  });

  return (
    <Card className="w-full shadow-sm border rounded-xl bg-card mb-4 select-none overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <Link
            href={profileHref}
            onClick={(e) => profileHref === "#" && e.preventDefault()}
          >
            <Avatar className="h-12 w-12 border border-border/50 shadow-sm relative overflow-hidden">
              {avatar_url ? (
                <Image
                  src={avatar_url}
                  alt={authorName || "مستخدم "}
                  fill
                  sizes="48px"
                  className="object-cover rounded-full"
                />
              ) : (
                <AvatarFallback className="bg-primary text-white font-bold">
                  {fallbackLetter}
                </AvatarFallback>
              )}
            </Avatar>
          </Link>
          <div>
            <Link
              href={profileHref}
              onClick={(e) => profileHref === "#" && e.preventDefault()}
              className="font-semibold text-[15px] hover:underline cursor-pointer"
            >
              {authorName}
            </Link>
            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
              <span>{formattedDate}</span>
              <span>•</span>
              <Globe className="h-3 w-3" />
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="المزيد"
              className="rounded-full h-8 w-8 text-muted-foreground cursor-pointer"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 rounded-xl p-1 bg-card border shadow-md"
          >
            <DropdownMenuItem className="flex items-center gap-2 p-2.5 rounded-lg text-sm cursor-pointer hover:bg-secondary">
              <Bookmark className="h-4 w-4 text-muted-foreground" />
              <span>حفظ المنشور</span>
            </DropdownMenuItem>

            {isOwnPost && (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setIsDeleteOpen(true);
                }}
                className="flex items-center gap-2 p-2.5 rounded-lg text-sm cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 font-medium"
              >
                <Trash2 className="h-4 w-4" />
                <span>حذف المنشور</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent
        className="p-4 pt-2 pb-3 text-[15px] leading-relaxed text-foreground wrap-break-word"
        dir="auto"
      >
        {post.content}

        {/* ─── تصميم البوست المشارك ─── */}
        {sharedPostId && (
          <div className="mt-3 border border-border rounded-xl overflow-hidden bg-card">
            {sharedPost ? (
              <>
                <div className="p-3 flex items-center gap-2 bg-secondary/30 border-b border-border/50">
                  <Avatar className="h-7 w-7 border">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {sharedProfile?.full_name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Link
                    href={sharedProfileHref}
                    onClick={(e) =>
                      sharedProfileHref === "#" && e.preventDefault()
                    }
                    className="font-semibold text-[14px] hover:underline cursor-pointer"
                  >
                    {sharedProfile?.full_name || "مستخدم مجهول"}
                  </Link>
                </div>

                {sharedPost.content && (
                  <div className="p-3 text-[14px] text-muted-foreground">
                    {sharedPost.content}
                  </div>
                )}

                {sharedPost.image_url && (
                  <Link
                    href={`/post/${sharedPost.id}`}
                    aria-label={`الانتقال إلى منشور ${sharedProfile?.full_name}`}
                    className="w-full border-t border-border/50 bg-secondary/10 block"
                  >
                    <div className="relative w-full aspect-video max-h-75 overflow-hidden">
                      <Image
                        src={sharedPost.image_url}
                        alt="Shared content"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        priority={priority}
                      />
                    </div>
                  </Link>
                )}
              </>
            ) : (
              <div className="p-5 text-center text-muted-foreground text-sm bg-secondary/10">
                هذا المنشور غير متوفر أو تم حذفه.
              </div>
            )}
          </div>
        )}
      </CardContent>

      {post.image_url && (
        <Link
          href={`/post/${post.id}`}
          aria-label={`الانتقال إلى منشور ${authorName}`}
          className="w-full cursor-pointer border-t border-b border-border/50 bg-secondary/20 block overflow-hidden"
        >
          <div className="relative w-full aspect-video max-h-125 overflow-hidden">
            <Image
              src={post.image_url}
              alt="Post media"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
              className="object-cover transition hover:brightness-95 duration-200"
              priority={priority}
            />
          </div>
        </Link>
      )}

      {(displayLikesCount > 0 || (post.comments?.length || 0) > 0) && (
        <div className="px-4 py-2 flex items-center justify-between text-xs text-muted-foreground border-b border-border/40">
          <div>
            {displayLikesCount > 0 && (
              <span
                onClick={() => setIsLikesOpen(true)}
                className="flex items-center gap-1 hover:underline cursor-pointer"
              >
                👍 {displayLikesCount}{" "}
                {displayLikesCount === 1 ? "شخص" : "أشخاص"}
              </span>
            )}
          </div>
          <div>
            {(post.comments?.length || 0) > 0 && (
              <span
                onClick={() => setIsCommentsOpen(true)}
                className="hover:underline cursor-pointer"
              >
                {post.comments?.length}{" "}
                {post.comments?.length === 1 ? "تعليق" : "تعليقات"}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="px-4">
        {!(displayLikesCount > 0 || (post.comments?.length || 0) > 0) && (
          <div className="border-t border-border" />
        )}
      </div>

      <CardFooter className="p-1 flex items-center justify-between gap-1">
        <Button
          variant="ghost"
          onClick={handleLikeToggle}
          disabled={likeMutation.isPending}
          className={`flex-1 gap-2 h-9 rounded-lg hover:bg-secondary transition text-sm font-medium ${
            displayIsLikedByMe
              ? "text-primary hover:text-primary dark:bg-primary/10 bg-primary/5 hover:bg-primary/10"
              : "text-muted-foreground"
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={displayIsLikedByMe ? "liked" : "unliked"}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ThumbsUp
                className={`h-5 w-5 ${displayIsLikedByMe ? "fill-current text-primary" : ""}`}
              />
            </motion.div>
          </AnimatePresence>
          <span>إعجاب</span>
        </Button>

        <Button
          variant="ghost"
          onClick={() => setIsCommentsOpen(true)}
          className="flex-1 gap-2 h-9 text-muted-foreground rounded-lg hover:bg-secondary transition text-sm cursor-pointer"
        >
          <MessageCircle className="h-5 w-5" />
          <span>تعليق</span>
        </Button>

        <Button
          variant="ghost"
          onClick={() => setIsShareOpen(true)}
          className="flex-1 gap-2 h-9 text-muted-foreground rounded-lg hover:bg-secondary transition text-sm cursor-pointer"
        >
          <Share2 className="h-5 w-5" />
          <span>مشاركة</span>
        </Button>
      </CardFooter>

      <CommentsDialog
        post={post}
        user={currentUserProfile ?? null}
        open={isCommentsOpen}
        onOpenChange={setIsCommentsOpen}
        trigger={null}
      />

      <DeletePostDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        isDeleting={deleteMutation.isPending}
        onConfirm={handleDelete}
      />

      <LikesDialog
        postId={post.id}
        open={isLikesOpen}
        onOpenChange={setIsLikesOpen}
      />

      <CreatePostDialog
        user={currentUserProfile ?? null}
        isOpen={isShareOpen}
        onOpenChange={setIsShareOpen}
        sharedPostId={post.id}
      />
    </Card>
  );
}
