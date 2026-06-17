import { Heart, MessageCircle, UserPlus, Share2, Bell } from "lucide-react";
import type { ReactNode } from "react";

export function getNotificationDetails(type: string): { icon: ReactNode; text: string } {
  switch (type) {
    case "like":
      return { icon: <Heart className="h-4 w-4 text-primary" />, text: "أعجب بمنشورك" };
    case "comment":
      return { icon: <MessageCircle className="h-4 w-4 text-green-500" />, text: "علق على منشورك" };
    case "friend_request":
      return { icon: <UserPlus className="h-4 w-4 text-blue-500" />, text: "أرسل لك طلب صداقة" };
    case "share":
      return { icon: <Share2 className="h-4 w-4 text-purple-500" />, text: "شارك منشورك" };
    default:
      return { icon: <Bell className="h-4 w-4 text-muted-foreground" />, text: "تفاعل معك" };
  }
}
