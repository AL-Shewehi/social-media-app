"use client";

import { Profile, PostCardPost } from "@/types/database.types";
import { MessageCircle } from "lucide-react";
import PostCard from "./PostCard";
import PostCardSkeleton from "./PostCardSkeleton";
import { useFeedPosts } from "../hooks/useFeedPosts";

interface RealtimeFeedListProps {
  initialPosts: PostCardPost[];
  currentUserId: string;
  currentUserProfile?: Profile | null;
  allowedUserIds?: string[];
  profileUserId?: string;
}

export default function RealtimeFeedList({
  initialPosts,
  currentUserId,
  currentUserProfile,
  allowedUserIds,
  profileUserId,
}: RealtimeFeedListProps) {
  
  const { posts, hasMore, loadMoreRef } = useFeedPosts({
    initialPosts,
    allowedUserIds,
    profileUserId,
  });

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            لا توجد منشورات بعد
          </h3>
          <p className="text-sm text-muted-foreground">
            شارك أول منشور لك أو قم بإضافة بعض الأصدقاء
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      {posts.map((post, index) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          currentUserProfile={currentUserProfile}
          priority={index === 0}
        />
      ))}

      {hasMore && (
        <div ref={loadMoreRef} className="space-y-4">
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-sm text-muted-foreground pt-6 pb-2">
          لقد وصلت إلى نهاية المنشورات المتاحة 🏁
        </p>
      )}
    </div>
  );
}