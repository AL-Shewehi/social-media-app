"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSinglePostAction } from "../actions";
import { normalizeProfile } from "@/lib/normalize";
import { postKeys } from "@/lib/query-key-factory";
import PostDetailMedia from "./PostDetailMedia";
import PostDetailInteractions from "./PostDetailInteractions";
import CreatePostDialog from "./CreatePostDialog";
import type { PostCardPost, Profile } from "@/types/database.types";

interface PostDetailPageProps {
  initialPost: PostCardPost | null;
  currentUserId: string;
  currentUserProfile: Profile | null;
}

export default function PostDetailPage({ initialPost, currentUserId, currentUserProfile }: PostDetailPageProps) {
  const [isShareOpen, setIsShareOpen] = useState(false);

  const { data: post } = useQuery({
    queryKey: postKeys.detail(initialPost?.id ?? ""),
    queryFn: async () => {
      const result = await fetchSinglePostAction(initialPost!.id);
      if (!result.success) throw new Error(result.error);
      return result.data as PostCardPost;
    },
    initialData: initialPost ?? undefined,
    enabled: !!initialPost?.id,
    refetchInterval: 60_000,
  });

  if (!post) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        المنشور غير موجود أو تم حذفه
      </div>
    );
  }

  const sharedAuthor = post.shared_post ? normalizeProfile(post.shared_post.profiles) : null;

  return (
    <>
      <div className="h-screen flex flex-col lg:flex-row-reverse rounded-xl overflow-hidden border lg:border-0">
        <PostDetailMedia
          imageUrl={post.image_url}
          sharedPost={post.shared_post}
          sharedAuthor={sharedAuthor}
        />

        <PostDetailInteractions
          post={post}
          currentUserId={currentUserId}
          currentUserProfile={currentUserProfile}
          sharedAuthor={sharedAuthor}
          onShare={() => setIsShareOpen(true)}
        />
      </div>

      <CreatePostDialog
        user={currentUserProfile}
        isOpen={isShareOpen}
        onOpenChange={setIsShareOpen}
        sharedPostId={post.id}
      />
    </>
  );
}
