"use client";

import { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { MessageSquare } from "lucide-react";
import type { Comment, Profile } from "@/types/database.types";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";

interface CommentsDialogProps {
  trigger: ReactNode;
  post: {
    id: string;
    content: string;
    profiles: Profile | null;
    comments: Comment[] | null;
    image_url?: string | null;
  };
  user: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommentsDialog({
  trigger,
  post,
  user,
  open,
  onOpenChange,
}: CommentsDialogProps) {
  const authorName = post.profiles?.full_name || "مستخدم مجهول";
  const fallbackLetter = authorName.charAt(0).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-card border border-border rounded-xl flex flex-col max-h-[85vh]">
        <DialogHeader className="p-4 border-b flex items-center justify-center">
          <DialogTitle className="text-center font-bold text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span>منشور {authorName}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            صندوق عرض التعليقات والتفاعل مع منشور المستخدم{" "}
            {post.profiles?.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex gap-3 bg-secondary/30 p-3 rounded-lg border border-border/50">
            <Avatar className="h-9 w-9 border">
              <AvatarFallback className="bg-primary text-white font-bold text-xs">
                {fallbackLetter}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h5 className="font-semibold text-sm">{authorName}</h5>
              <p
                className="text-[14px] text-foreground mt-1 wrap-break-word"
                dir="auto"
              >
                {post.content}
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
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                لا توجد تعليقات بعد. كن أول من يترك بصمته! 💬
              </div>
            )}
          </div>
        </div>

        <CommentForm postId={post.id} user={user} />
      </DialogContent>
    </Dialog>
  );
}
