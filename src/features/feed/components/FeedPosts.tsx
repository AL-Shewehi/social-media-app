"use client";

import { Profile, PostCardPost } from "@/types/database.types";
import { MessageCircle, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PostCard from "./PostCard";
import PostCardSkeleton from "./PostCardSkeleton";
import { useFeedPosts } from "../hooks/useFeedPosts";

interface FeedPostsProps {
  initialPosts: PostCardPost[];
  currentUserId: string;
  currentUserProfile?: Profile | null;
  allowedUserIds?: string[];
  profileUserId?: string;
}

export default function FeedPosts({
  initialPosts,
  currentUserId,
  currentUserProfile,
  allowedUserIds,
  profileUserId,
}: FeedPostsProps) {
  const { posts, hasMore, loadMoreRef, newPostsCount, mergeNewPosts } = useFeedPosts({
    initialPosts,
    allowedUserIds,
    profileUserId,
  });

  const handleNewPostsClick = () => {
    mergeNewPosts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
    <div className="space-y-4 pb-10 relative">
      <AnimatePresence>
        {newPostsCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            onClick={handleNewPostsClick}
            className="sticky top-2 z-30 mx-auto flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <ArrowUp className="h-4 w-4" />
            <span className="text-sm font-medium whitespace-nowrap">
              ⬆️ يوجد {newPostsCount} منشورات جديدة
            </span>
          </motion.button>
        )}
      </AnimatePresence>

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
