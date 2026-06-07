"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { type PostCardProps } from "@/types/database.types";
import { useState } from "react";
import CommentsDialog from "./CommentsDialog";
import { toggleLikeAction, deletePostAction } from "../actions";
import { toast } from "sonner";
import { DeletePostDialog } from "./DeletePostDialog";
import Link from "next/link";

export default function PostCard({
  post,
  currentUserId,
  currentUserProfile,
}: PostCardProps) {
  const [isLikePending, setIsLikePending] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const formattedDate = new Date(post.created_at).toLocaleDateString("ar-EG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const autherName = post.profiles?.full_name || "مستخدم مجهول";
  const avatar_url = post.profiles?.avatar_url || "";
  const fallbackLetter = autherName.charAt(0).toUpperCase();

  const likesCount = post.likes?.length || 0;
  const isLikedByMe =
    post.likes?.some((like) => like.user_id === currentUserId) || false;
  const isOwnPost = post.user_id === currentUserId;

  const handleLikeToggle = async () => {
    if (isLikePending) return;
    setIsLikePending(true);

    const result = await toggleLikeAction(post.id);

    setIsLikePending(false);
    if (!result.success) {
      toast.error(result.error || "فشل تعديل الإعجاب");
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    const result = await deletePostAction(post.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success("تم حذف المنشور بنجاح");
      setIsDeleteOpen(false);
    } else {
      toast.error(result.error || "فشل حذف المنشور");
    }
  };

  return (
    <Card className="w-full shadow-sm border rounded-xl bg-card mb-4 select-none overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.profiles?.id}`}>
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={avatar_url} alt={autherName} />
              <AvatarFallback className="bg-primary text-white font-bold">
                {fallbackLetter}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link href={`/profile/${post.profiles?.id}`} className="font-semibold text-[15px] hover:underline cursor-pointer">
              {autherName}
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

      {/* محتوى النص */}
      <CardContent
        className="p-4 pt-2 pb-3 text-[15px] leading-relaxed text-foreground wrap-break-word"
        dir="auto"
      >
        {post.content}
      </CardContent>

      {post.image_url && (
        <div
          onClick={() => setIsCommentsOpen(true)}
          className="w-full cursor-pointer border-t border-b border-border/50 bg-secondary/20 flex items-center justify-center max-h-[500px] overflow-hidden"
        >
          <img
            src={post.image_url}
            alt="Post media"
            className="w-full h-full object-cover max-h-[500px] transition hover:brightness-95 duration-200"
            loading="lazy"
          />
        </div>
      )}

      {(likesCount > 0 || (post.comments?.length || 0) > 0) && (
        <div className="px-4 py-2 flex items-center justify-between text-xs text-muted-foreground border-b border-border/40">
          <div>
            {likesCount > 0 && (
              <span className="flex items-center gap-1">
                👍 {likesCount} {likesCount === 1 ? "شخص" : "أشخاص"}
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
        {!(likesCount > 0 || (post.comments?.length || 0) > 0) && (
          <div className="border-t border-border" />
        )}
      </div>

      <CardFooter className="p-1 flex items-center justify-between gap-1">
        <Button
          variant="ghost"
          onClick={handleLikeToggle}
          disabled={isLikePending}
          className={`flex-1 gap-2 h-9 rounded-lg hover:bg-secondary transition text-sm font-medium ${
            isLikedByMe
              ? "text-primary hover:text-primary bg-primary/5 hover:bg-primary/10"
              : "text-muted-foreground"
          }`}
        >
          <ThumbsUp
            className={`h-5 w-5 ${isLikedByMe ? "fill-current" : ""}`}
          />
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
          className="flex-1 gap-2 h-9 text-muted-foreground rounded-lg hover:bg-secondary transition text-sm"
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
        trigger={null} // الغاء الـ trigger التلقائي
      />

      <DeletePostDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
