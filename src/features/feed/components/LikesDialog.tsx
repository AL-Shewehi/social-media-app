"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { fetchPostLikesAction } from "@/features/feed/actions";
import { useQuery } from "@tanstack/react-query";
import type { Profile } from "@/types/database.types";

interface LikeItem {
  id: string;
  profile: Profile | null;
}

interface LikesDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LikesDialog({ postId, open, onOpenChange }: LikesDialogProps) {
  const { data: likes, isLoading } = useQuery({
    queryKey: ["likes", postId],
    queryFn: async () => {
      const result = await fetchPostLikesAction(postId);
      if (!result.success) throw new Error(result.error);
      return (result.data ?? []) as LikeItem[];
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-card border rounded-xl">
        <DialogHeader className="p-4 border-b bg-secondary/10 relative">
          <DialogTitle className="flex items-center justify-center gap-2 text-base pl-8">
            <div className="p-1.5 bg-primary/10 rounded-full">
              <ThumbsUp className="h-4 w-4 text-primary" fill="currentColor" />
            </div>
            <span>الأشخاص الذين تفاعلوا</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            قائمة بالأشخاص الذين أعجبوا بالمنشور
          </DialogDescription>
        </DialogHeader>

        <div className="p-2 max-h-[350px] overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : likes && likes.length > 0 ? (
            <div className="space-y-1">
              {likes.map((like) => {
                const profile = like.profile;
                const fallback = profile?.full_name?.charAt(0).toUpperCase() || "?";

                return (
                  <div key={like.id} className="flex items-center gap-3 p-2 hover:bg-secondary/50 rounded-lg transition">
                    <Link href={`/profile/${profile?.id}`}>
                      <Avatar className="h-10 w-10 border cursor-pointer hover:opacity-80 transition">
                        <AvatarImage src={profile?.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary text-white font-bold">{fallback}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      <Link href={`/profile/${profile?.id}`} className="font-semibold text-sm hover:underline cursor-pointer">
                        {profile?.full_name || "مستخدم مجهول"}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              لا توجد إعجابات حتى الآن.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
