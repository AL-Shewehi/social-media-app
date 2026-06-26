"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { fetchMorePostsAction, fetchProfilePostsAction } from "@/features/feed/actions";
import type { PostCardPost } from "@/types/database.types";

interface UseFeedPostsProps {
  initialPosts: PostCardPost[];
  allowedUserIds?: string[];
  profileUserId?: string;
}

const PAGE_SIZE = 15;

export function useFeedPosts({ initialPosts, allowedUserIds, profileUserId }: UseFeedPostsProps) {
  const queryClient = useQueryClient();
  const isMainFeed = !!allowedUserIds;
  const isProfileFeed = !!profileUserId;

  const queryKey: unknown[] = isProfileFeed
    ? ["feed", "profile", profileUserId]
    : ["feed", "all", allowedUserIds?.join(",") ?? ""];

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey,
      queryFn: async ({ pageParam }) => {
        if (profileUserId) {
          const result = await fetchProfilePostsAction(
            profileUserId,
            pageParam as string | undefined
          );
          if (!result.success) throw new Error(result.error);
          return result.data as PostCardPost[];
        }
        const result = await fetchMorePostsAction(
          pageParam as string | undefined,
          allowedUserIds ?? []
        );
        if (!result.success) throw new Error(result.error);
        return result.data as PostCardPost[];
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => {
        if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
        return lastPage[lastPage.length - 1].created_at;
      },
      initialData: { pages: [initialPosts], pageParams: [undefined] },
      staleTime: 1000 * 60 * 3,
      gcTime: 1000 * 60 * 10,
    });

  const hasPagination = isMainFeed;
  const posts = data?.pages.flat() ?? [];
  const hasMore = hasPagination ? !!hasNextPage : false;
  const isLoadingMore = hasPagination ? isFetchingNextPage : false;

  const [newPostsCount, setNewPostsCount] = useState(0);
  const pendingPostsRef = useRef<PostCardPost[]>([]);
  const knownIdsRef = useRef(new Set<string>());

  useEffect(() => {
    knownIdsRef.current = new Set(posts.map((p) => p.id));
  }, [posts]);

  useEffect(() => {
    if (!isMainFeed) return;

    const poll = async () => {
      try {
        const result = await fetchMorePostsAction(undefined, allowedUserIds ?? []);
        if (!result.success) return;

        const latestPosts = result.data as PostCardPost[];
        const knownIds = knownIdsRef.current;

        const newOnes = latestPosts.filter((p) => !knownIds.has(p.id));
        if (newOnes.length === 0) return;

        pendingPostsRef.current = [...newOnes, ...pendingPostsRef.current];
        newOnes.forEach((p) => knownIds.add(p.id));
        setNewPostsCount((prev) => prev + newOnes.length);
      } catch {
        /* silent */
      }
    };

    const interval = setInterval(poll, 60_000);
    return () => clearInterval(interval);
  }, [isMainFeed, allowedUserIds]);

  const mergeNewPosts = useCallback(() => {
    if (pendingPostsRef.current.length === 0) return;

    queryClient.setQueryData<InfiniteData<PostCardPost[]>>(
      queryKey,
      (old) => {
        if (!old) return old;
        const existingIds = new Set(old.pages.flat().map((p) => p.id));
        const toMerge = pendingPostsRef.current.filter((p) => !existingIds.has(p.id));
        if (toMerge.length === 0) return old;
        return {
          ...old,
          pages: [
            [...toMerge, ...old.pages[0]],
            ...old.pages.slice(1),
          ],
        };
      }
    );

    pendingPostsRef.current = [];
    setNewPostsCount(0);
  }, [queryClient, queryKey]);

  useEffect(() => {
    const handler = () => {
      mergeNewPosts();
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    };
    window.addEventListener("feed:refresh", handler);
    return () => window.removeEventListener("feed:refresh", handler);
  }, [mergeNewPosts, queryClient]);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isProfileFeed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          fetchNextPage();
        }
      },
      { rootMargin: "600px" }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, fetchNextPage, isProfileFeed]);

  return { posts, hasMore, isLoadingMore, loadMoreRef, newPostsCount, mergeNewPosts };
}
