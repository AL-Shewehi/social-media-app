"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  UserCheck, 
  UserX, 
  UserMinus, 
  Loader2,
  ChevronDown
} from "lucide-react";
import { 
  sendFriendRequestAction, 
  acceptFriendRequestAction, 
  cancelOrRemoveFriendshipAction 
} from "../actions";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FriendshipButtonProps {
  targetUserId: string;
  currentUserId: string;
  initialFriendship: {
    id: string;
    sender_id: string;
    receiver_id: string;
    status: "pending" | "accepted" | "declined";
  } | null;
  isCardView?: boolean;
}

export default function FriendshipButton({ 
  targetUserId, 
  currentUserId, 
  initialFriendship, 
  isCardView = false 
}: FriendshipButtonProps) {
  
  const [friendship, setFriendship] = useState(initialFriendship);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setFriendship(initialFriendship);
  }, [initialFriendship]);

  // اكشن ارسال الطلب
  const handleSendRequest = async () => {
    setIsPending(true);
    
    setFriendship({
      id: "__optimistic__", 
      sender_id: currentUserId,
      receiver_id: targetUserId,
      status: "pending"
    });

    const result = await sendFriendRequestAction(targetUserId);
    setIsPending(false);

    if (result.success) {
      toast.success("تم إرسال طلب الصداقة بنجاح! ✉️");
    } else {
      // Rollback لو حصل مشكلة
      setFriendship(initialFriendship);
      toast.error(result.error || "فشل إرسال طلب الصداقة");
    }
  };

  // أكشن قبول الطلب
  const handleAcceptRequest = async () => {
    if (!friendship?.id) return;
    
    if (friendship.id === "__optimistic__") {
      toast.info("جاري المعالجة، يرجى الانتظار لحظة...");
      return;
    }

    setIsPending(true);
    const result = await acceptFriendRequestAction(friendship.id, friendship.sender_id);
    setIsPending(false);

    if (result.success) {
      toast.success("تهانينا! أصبحتما أصدقاء الآن 🤝");
      setFriendship({ ...friendship, status: "accepted" });
    } else {
      toast.error(result.error || "فشل قبول طلب الصداقة");
    }
  };

  // أكشن إلغاء / رفض / حذف الصداقة
  const handleRemoveOrCancel = async () => {
    if (!friendship?.id) return;
    
    if (friendship.id === "__optimistic__") {
      toast.info("جاري المعالجة، يرجى الانتظار لحظة...");
      return;
    }

    setIsPending(true);
    const result = await cancelOrRemoveFriendshipAction(friendship.id, targetUserId);
    setIsPending(false);

    if (result.success) {
      toast.success("تم تحديث القائمة بنجاح");
      setFriendship(null); 
    } else {
      toast.error(result.error || "حدث خطأ أثناء معالجة الطلب");
    }
  };

  if (isPending) {
    return (
      <Button disabled className={`gap-2 rounded-lg font-medium ${isCardView ? "w-full mt-3" : "mb-2 min-w-30"}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        {isCardView ? null : <span>جاري المعالجة...</span>}
      </Button>
    );
  }

  // Card View
  if (isCardView) {
    if (!friendship) {
      return (
        <Button onClick={handleSendRequest} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md mt-3 font-bold">
          إضافة صديق
        </Button>
      );
    }

    if (friendship.status === "pending") {
      if (friendship.sender_id === currentUserId) {
        return (
          <Button onClick={handleRemoveOrCancel} className="w-full bg-secondary hover:bg-secondary/80 text-foreground rounded-md mt-3 font-bold">
            إلغاء الطلب
          </Button>
        );
      }
      return (
        <div className="flex flex-col gap-2 w-full mt-3">
          <Button onClick={handleAcceptRequest} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-bold">
            تأكيد
          </Button>
          <Button onClick={handleRemoveOrCancel} className="w-full bg-[#e4e6eb] hover:bg-[#d8dadf] text-black rounded-md font-bold dark:bg-[#3a3b3c] dark:text-[#e4e6eb]">
            حذف
          </Button>
        </div>
      );
    }

    if (friendship.status === "accepted") {
      return (
        <Button onClick={handleRemoveOrCancel} className="w-full bg-secondary hover:bg-destructive/10 hover:text-destructive text-foreground rounded-md mt-3 font-bold transition">
          إلغاء الصداقة
        </Button>
      );
    }
  }

  // التصميم الافتراضي
  if (!friendship) {
    return (
      <Button onClick={handleSendRequest} className="gap-2 rounded-lg font-medium shadow-sm mb-2 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90">
        <UserPlus className="h-4 w-4" />
        <span>إضافة صديق</span>
      </Button>
    );
  }

  if (friendship.status === "pending") {
    if (friendship.sender_id === currentUserId) {
      return (
        <Button onClick={handleRemoveOrCancel} variant="secondary" className="gap-2 rounded-lg font-medium shadow-sm mb-2 cursor-pointer text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition">
          <UserX className="h-4 w-4" />
          <span>إلغاء الطلب</span>
        </Button>
      );
    }
    
    return (
      <div className="flex items-center gap-2 mb-2">
        <Button onClick={handleAcceptRequest} className="gap-2 rounded-lg font-medium shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
          <UserCheck className="h-4 w-4" />
          <span>تأكيد الطلب</span>
        </Button>
        <Button onClick={handleRemoveOrCancel} variant="outline" className="rounded-lg font-medium text-destructive hover:bg-destructive/5 cursor-pointer border-destructive/30">
          حذف
        </Button>
      </div>
    );
  }

  if (friendship.status === "accepted") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="gap-2 rounded-lg font-medium shadow-sm mb-2 cursor-pointer text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20">
            <UserCheck className="h-4 w-4 fill-current" />
            <span>الأصدقاء</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 rounded-xl p-1 bg-card border shadow-md">
          <DropdownMenuItem 
            onClick={handleRemoveOrCancel}
            className="flex items-center gap-2 p-2.5 rounded-lg text-sm cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 font-medium"
          >
            <UserMinus className="h-4 w-4" />
            <span>إلغاء الصداقة</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
}