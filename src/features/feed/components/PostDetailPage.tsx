"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSinglePostAction } from "../actions";
import { createClient } from "@/lib/supabase/client";
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
  const queryClient = useQueryClient();
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
  });

  useEffect(() => {
    if (!initialPost?.id) return;
    let isMounted = true;
    const supabase = createClient();

    const channel = supabase
      .channel(`post-detail-${initialPost.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "posts",
        filter: `id=eq.${initialPost.id}`,
      }, () => {
        if (!isMounted) return;
        queryClient.invalidateQueries({ queryKey: ["post", initialPost.id] });
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "comments",
        filter: `post_id=eq.${initialPost.id}`,
      }, () => {
        if (!isMounted) return;
        queryClient.invalidateQueries({ queryKey: ["post", initialPost.id] });
      })
      .subscribe();

    return () => { isMounted = false; supabase.removeChannel(channel); };
  }, [initialPost?.id, queryClient]);

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
