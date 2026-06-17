"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchMorePostsAction, fetchProfilePostsAction } from "@/features/feed/actions";
import { formatPosts, RawPostData } from "@/lib/formatPosts";
import { useInfiniteQuery, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { POST_SELECT } from "@/lib/queries/posts";
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
    });

  const hasPagination = isMainFeed;
  const posts = data?.pages.flat() ?? [];
  const hasMore = hasPagination ? !!hasNextPage : false;
  const isLoadingMore = hasPagination ? isFetchingNextPage : false;

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
            queryClient
              .getQueryCache()
              .findAll({ queryKey: ["feed"] })
              .forEach((query) => {
                queryClient.setQueryData<InfiniteData<PostCardPost[]>>(
                  query.queryKey,
                  (old) => {
                    if (!old) return old;
                    return {
                      ...old,
                      pages: old.pages.map((page) =>
                        page.filter((p) => p.id !== payload.old.id)
                      ),
                    };
                  }
                );
              });
          } else if (payload.eventType === "INSERT") {
            const newPostUserId = (payload.new as Record<string, unknown>)
              ?.user_id as string | undefined;

            const fetchFullPostData = async () => {
              try {
                const { data: fullPostData, error } = await supabase
                  .from("posts")
                  .select(POST_SELECT)
                  .eq("id", payload.new.id)
                  .single();

                if (error || !fullPostData || !isMounted) return;

                const newFormattedPost = formatPosts(
                  [fullPostData as unknown as RawPostData],
                  new Set()
                )[0];
                if (!newFormattedPost) return;

                queryClient
                  .getQueryCache()
                  .findAll({ queryKey: ["feed"] })
                  .forEach((query) => {
                    const key = query.queryKey;
                    const feedType = key[1];

                    if (feedType === "all") {
                      const allowedList = (key[2] as string)?.split(",") || [];
                      if (
                        newPostUserId &&
                        !allowedList.includes(newPostUserId)
                      )
                        return;
                    } else if (feedType === "profile") {
                      if (newPostUserId !== key[2]) return;
                    }

                    queryClient.setQueryData<InfiniteData<PostCardPost[]>>(
                      query.queryKey,
                      (old) => {
                        if (!old) return old;
                        const alreadyExists = old.pages.some((page) =>
                          page.some((p) => p.id === newFormattedPost.id)
                        );
                        if (alreadyExists) return old;
                        return {
                          ...old,
                          pages: [
                            [
                              newFormattedPost as PostCardPost,
                              ...old.pages[0],
                            ],
                            ...old.pages.slice(1),
                          ],
                        };
                      }
                    );
                  });
              } catch {
                /* silent */
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
  }, [queryClient]);

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

  return { posts, hasMore, isLoadingMore, loadMoreRef };
}
