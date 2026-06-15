"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchMorePostsAction } from "@/features/feed/actions";
import { formatPosts, RawPostData } from "@/lib/formatPosts";
import { toast } from "sonner";
import type { PostCardPost, Post } from "@/types/database.types";

interface UsePostsProps {
  initialPosts: PostCardPost[];
  allowedUserIds?: string[];
}

export function usePosts({ initialPosts, allowedUserIds }: UsePostsProps) {
  const [posts, setPosts] = useState<PostCardPost[]>(initialPosts);

  // ─── Pagination States (Cursor Based) ───
  const pageSize = 15;
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length === pageSize);
  const [hasScrolled, setHasScrolled] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const allowedUserIdsKey = allowedUserIds?.join(",") || "";

  useEffect(() => {
    if (!hasScrolled) {
      setPosts(initialPosts);
      setHasMore(initialPosts.length === pageSize);
    }
  }, [initialPosts, hasScrolled, pageSize]);

  // ─── Realtime Subscription ───
  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const channel = supabase
      .channel("realtime-feed-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => {
          if (!isMounted) return;

          if (payload.eventType === "DELETE") {
            setPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
          } else if (payload.eventType === "UPDATE") {
            setPosts((prev) =>
              prev.map((p) =>
                p.id === payload.new.id
                  ? { ...p, ...(payload.new as Post) }
                  : p
              )
            );
          } else if (payload.eventType === "INSERT") {
            const newPostUserId = payload.new?.user_id;
            if (
              allowedUserIds &&
              newPostUserId &&
              !allowedUserIds.includes(newPostUserId)
            )
              return;

            const fetchFullPostData = async () => {
              try {
                const { data: fullPostData, error } = await supabase
                  .from("posts")
                  .select(
                    `
                    id, content, created_at, user_id, image_url, shared_post_id,
                    profiles!posts_user_id_fkey (id, full_name, avatar_url),
                    comments (
                      id, content, created_at, user_id, 
                      profiles (id, full_name, avatar_url)
                    ),
                    likes (count),
                    shared_post:shared_post_id (
                      id, content, image_url,
                      profiles:profiles!posts_user_id_fkey (id, full_name, avatar_url)
                    )
                  `
                  )
                  .eq("id", payload.new.id)
                  .single();

                if (error) {
                  console.error("Error fetching full post data:", error);
                  return;
                }

                if (fullPostData && isMounted) {
                  const newFormattedPost = formatPosts([fullPostData as unknown as RawPostData], new Set())[0];

                  setPosts((prev) => {
                    if (prev.some((p) => p.id === newFormattedPost.id)) return prev;
                    return [newFormattedPost as PostCardPost, ...prev];
                  });
                }
              } catch (error) {
                console.error("Error fetching full post data:", error);
              }
            };

            fetchFullPostData();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [allowedUserIdsKey, allowedUserIds]);

  // ─── Load More Posts ───
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setHasScrolled(true);

    const cursor = posts.length > 0 ? posts[posts.length - 1].created_at : undefined;

    const result = await fetchMorePostsAction(cursor, allowedUserIds || []);

    if (result.success && Array.isArray(result.data)) {
      if (result.data.length < pageSize) {
        setHasMore(false);
      }
      setPosts((prev) => {
        const newPosts = (result.data as PostCardPost[]).filter(
          (newP) => !prev.some((p) => p.id === newP.id)
        );
        return [...prev, ...newPosts];
      });
    } else {
      toast.error("فشل تحميل المزيد من المنشورات");
    }

    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, posts, allowedUserIds]);

  // ─── الـ Intersection Observer ───
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMorePosts();
        }
      },
      { rootMargin: "600px" }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMorePosts]);

  return {
    posts,
    hasMore,
    isLoadingMore,
    loadMoreRef,
  };
}