"use client"

import { Post, Profile } from "@/types/database.types";
import { createBrowserClient } from "@supabase/ssr";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PostCard from "./PostCard";

interface RealtimeFeedListProps {
    initialPosts: Post[]
    currentUserId: string;
    currentUserProfile?: Profile | null;
}

export default function RealtimeFeedList({ initialPosts, currentUserId, currentUserProfile }: RealtimeFeedListProps) {
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>(initialPosts);

    useEffect(() => {
        setPosts(initialPosts)
    }, [initialPosts]);

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const channel = supabase
            .channel("realtime-feed-channel")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "posts" },
                (payload) => {
                    console.log("Realtime Post Change Event:", payload.eventType);

                    if (payload.eventType === "DELETE") {
                        setPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
                    } else {
                        router.refresh();
                    }
                }
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "likes" },
                () => router.refresh()
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "comments" },
                () => router.refresh()
            ).subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router])

    if (posts.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد منشورات بعد</h3>
                    <p className="text-sm text-muted-foreground">شارك أول منشور لك أو اتبع بعض الحسابات</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map(post => (
                <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    currentUserProfile={currentUserProfile}
                />
            ))}
        </div>
    )
}