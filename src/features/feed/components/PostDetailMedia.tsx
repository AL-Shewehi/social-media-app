"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle } from "lucide-react";
import type { Profile, SharedPost } from "@/types/database.types";

interface PostDetailMediaProps {
  imageUrl?: string | null;
  sharedPost?: SharedPost | null;
  sharedAuthor?: Profile | null;
}

export default function PostDetailMedia({ imageUrl, sharedPost, sharedAuthor }: PostDetailMediaProps) {
  return (
    <div className="hidden lg:flex w-1/2 h-full bg-black/5 items-center justify-center overflow-hidden">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : sharedPost ? (
        <div className="p-8 max-w-md w-full">
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-2 mb-3 justify-center">
              <Avatar className="h-8 w-8 border">
                <AvatarImage src={sharedAuthor?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {sharedAuthor?.full_name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm">
                {sharedAuthor?.full_name || "مستخدم"}
              </span>
            </div>
            {sharedPost.content && (
              <p className="text-sm text-muted-foreground mb-3 text-center">{sharedPost.content}</p>
            )}
            {sharedPost.image_url && (
              <img src={sharedPost.image_url} alt="" className="rounded-lg w-full max-h-80 object-cover" />
            )}
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground/20">
          <MessageCircle className="h-24 w-24" />
        </div>
      )}
    </div>
  );
}
