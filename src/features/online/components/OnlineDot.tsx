"use client";

import { useOnlineStore } from "@/store/useOnlineStore";
import { useFriendIds } from "../hooks/useFriendIds";
import { cn } from "@/lib/utils";

interface OnlineDotProps {
  userId: string;
  className?: string;
}

export default function OnlineDot({ userId, className }: OnlineDotProps) {
  const onlineIds = useOnlineStore((s) => s.onlineIds);
  const { data: friendIds } = useFriendIds();

  const isOnline = onlineIds.has(userId);
  const isFriend = friendIds?.includes(userId);
  const showOnline = isOnline && isFriend;

  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-background",
        showOnline ? "bg-green-500" : "bg-gray-400",
        className,
      )}
    />
  );
}
