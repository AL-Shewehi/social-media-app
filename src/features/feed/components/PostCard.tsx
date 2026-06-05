"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Globe } from "lucide-react";
import { type PostCardProps } from "@/types/database.types";
import { useState } from "react";
import CommentsDialog from "./CommentsDialog";
import { toggleLikeAction } from "../actions";
import { toast } from "sonner";



export default function PostCard({ post, currentUserId }: PostCardProps) {
  const [isLikePending, setIsLikePending] = useState(false)
  
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

  const isLikedByMe = post.likes?.some(like => like.user_id === currentUserId) || false;

  const handleLikeToggle = async () => {
    if (isLikePending) return;
    setIsLikePending(true);
    
    const result = await toggleLikeAction(post.id);
    
    setIsLikePending(false);
    if (!result.success) {
      toast.error(result.error || "فشل تعديل الإعجاب");
    }
  };


  return (
    <Card className="w-full shadow-sm border rounded-xl bg-card mb-4 select-none">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={avatar_url} alt={autherName} />
            <AvatarFallback className="bg-primary text-white font-bold">{fallbackLetter}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-[15px] hover:underline cursor-pointer">{autherName}</h4>
            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
              <span>{formattedDate}</span>
              <span>•</span>
              <Globe className="h-3 w-3" />
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-muted-foreground">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>

      <CardContent className="p-4 pt-2 pb-3 text-[15px] leading-relaxed text-foreground wrap-break-word" dir="auto">
        {post.content}
      </CardContent>

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
              <span>{post.comments?.length} تعليق</span>
            )}
          </div>
        </div>
      )}

      <div className="px-4">
        <div className="border-t border-border" />
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
          <ThumbsUp className={`h-5 w-5 ${isLikedByMe ? "fill-current" : ""}`} />
          <span>إعجاب</span>
        </Button>

        <CommentsDialog 
          post={post}
          trigger={
            <Button variant="ghost" className="flex-1 gap-2 h-9 text-muted-foreground rounded-lg hover:bg-secondary transition text-sm cursor-pointer">
              <MessageCircle className="h-5 w-5" />
              <span>تعليق</span>
            </Button>
          }
        />

        <Button variant="ghost" className="flex-1 gap-2 h-9 text-muted-foreground rounded-lg hover:bg-secondary transition text-sm">
          <Share2 className="h-5 w-5" />
          <span>مشاركة</span>
        </Button>
      </CardFooter>

      
    </Card>
  );
}