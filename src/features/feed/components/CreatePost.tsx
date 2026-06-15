"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image, Smile, Video } from "lucide-react";
import type { Profile } from "@/types/database.types";
import { useUIStore } from "@/store/useUIStore";
import CreatePostDialog from "./CreatePostDialog";

interface CreatePostProps {
  user: Profile | null;
}

export default function CreatePost({ user }: CreatePostProps) {
  const isOpen = useUIStore((state) => state.isCreatePostOpen);
  const setIsOpen = useUIStore((state) => state.setCreatePostOpen);

  const Author = user?.full_name || "مستخدم مجهول";
  const firstName = Author?.split(" ")[0] || "";
  const fallbackLetter = Author.charAt(0).toUpperCase();

  return (
    <Card className="w-full shadow-sm border rounded-xl bg-card p-4 select-none mb-4">
      <CardContent className="p-0 space-y-4">
        
        {/* الاختصار الخارجي لفتح الموديل */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={user?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary text-white font-bold">{fallbackLetter}</AvatarFallback>
          </Avatar>
          
          <Button 
            variant="secondary" 
            onClick={() => setIsOpen(true)}
            className="flex-1 justify-start h-10 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground text-[15px] px-4 font-normal cursor-pointer"
          >
            بم تفكر يا {firstName}؟
          </Button>
        </div>

        <div className="border-t border-border" />

        {/* الأزرار السريعة الخارجية */}
        <div className="flex items-center justify-between p-1 gap-1">
          <Button variant="ghost" className="flex-1 gap-2 h-10 text-muted-foreground rounded-lg hover:bg-secondary text-[14px]">
            <Video className="h-5 w-5 text-red-500" />
            <span>فيديو مباشر</span>
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => { 
              setIsOpen(true); 
              // فقط لتحديد الصورة في الموديل
              setTimeout(() => document.getElementById("post-image-input")?.click(), 100); 
            }}
            className="flex-1 gap-2 h-10 text-muted-foreground rounded-lg hover:bg-secondary text-[14px]"
          >
            <Image className="h-5 w-5 text-emerald-500" />
            <span>صورة/فيديو</span>
          </Button>
          
          <Button variant="ghost" className="flex-1 gap-2 h-10 text-muted-foreground rounded-lg hover:bg-secondary text-[14px]">
            <Smile className="h-5 w-5 text-amber-500" />
            <span>شعور/نشاط</span>
          </Button>
        </div>

        <CreatePostDialog 
          user={user} 
          isOpen={isOpen} 
          onOpenChange={setIsOpen} 
        />
        
      </CardContent>
    </Card>
  );
}