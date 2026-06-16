"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateConversationAction } from "../actions";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MessageButtonProps {
  targetUserId: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export default function MessageButton({ targetUserId, className, variant = "default" }: MessageButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleMessageClick = async () => {
    if (isPending) return;
    setIsPending(true);

    const result = await getOrCreateConversationAction(targetUserId);

    if (result.success && result.data) {
      router.push(`/chat/${result.data}`);
    } else {
      toast.error(result.error || "حدث خطأ أثناء فتح المحادثة");
      setIsPending(false);
    }
  };

  return (
    <Button
      variant={variant}
      className={cn("gap-2", className)}
      onClick={handleMessageClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessageCircle className="h-4 w-4" />
      )}
      <span>مراسلة</span>
    </Button>
  );
}