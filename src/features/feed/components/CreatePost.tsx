"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Image, Smile, Video, Globe } from "lucide-react";
import { createPostAction } from "../actions";
import { toast } from "sonner"

interface CreatePostProps {
  user: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function CreatePost({ user }: CreatePostProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [postText, setPostText] = useState("");
  const [isPending, setIsPending] = useState(false);

  const Author = user?.full_name || "مستخدم مجهول";
  const firstName = Author?.split(" ")[0]
  const fallbackLetter = Author.charAt(0).toUpperCase();
  const avatar = user?.avatar_url || undefined



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim() || isPending) return;

    setIsPending(true)

    const result = await createPostAction(postText);
    setIsPending(false);
    if (result.success) {
      setPostText("");
      setIsOpen(false);
      toast.success("تم نشر المنشور بنجاح")
    } else {
      toast.error(result.error || "حدث خطأ أثناء نشر المنشور")
    }

  };

  return (
    <Card className="w-full shadow-sm border rounded-xl bg-card mb-4 select-none">
      <CardContent className="p-4 space-y-3">

        {/* الجزء العلوي: الصورة وصندوق الإدخال الذي يفتح الـ Dialog */}
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={avatar} alt={Author} />
            <AvatarFallback className="bg-primary text-white font-bold">{fallbackLetter}</AvatarFallback>
          </Avatar>

          {/* الـ Dialog الرئيسي */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button
                className="flex-1 h-10 bg-secondary hover:bg-secondary/80 text-right px-4 rounded-full text-muted-foreground text-[15px] transition duration-200 cursor-pointer"
              >
                بم تفكر يا {firstName}؟
              </button>
            </DialogTrigger>

            {/* محتوى الـ Pop-up (الـ Modal) */}
            <DialogContent aria-describedby={""} className="sm:max-w-[500px] p-0 overflow-hidden gap-0 bg-card border border-border rounded-xl">
              <DialogHeader className="p-4 border-b flex items-center justify-between relative">
                <DialogTitle className="text-center w-full font-bold text-lg">
                  إنشاء منشور
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 border">
                    <AvatarImage src={avatar} alt={Author} />
                    <AvatarFallback className="bg-primary text-white font-bold">{fallbackLetter}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-[15px]">{Author}</h4>
                    <div className="flex items-center gap-1 bg-secondary text-muted-foreground text-xs px-2 py-0.5 rounded-md mt-0.5 w-fit">
                      <Globe className="h-3 w-3" />
                      <span>العامة</span>
                    </div>
                  </div>
                </div>

                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder={`بم تفكر يا ${firstName}؟`}
                  className="w-full min-h-[150px] bg-transparent border-none resize-none focus:outline-none text-foreground placeholder:text-muted-foreground text-lg leading-relaxed"
                  dir="auto"
                />

                <div className="flex items-center justify-between border border-border rounded-lg p-3 bg-background/50">
                  <span className="font-semibold text-sm">إضافة إلى منشورك</span>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="rounded-full text-green-500 hover:bg-secondary h-9 w-9">
                      <Image className="h-6 w-6" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="rounded-full text-blue-500 hover:bg-secondary h-9 w-9">
                      <Video className="h-6 w-6" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="rounded-full text-yellow-500 hover:bg-secondary h-9 w-9">
                      <Smile className="h-6 w-6" />
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!postText.trim() || isPending}
                  className="w-full h-10 font-semibold text-[15px]"
                >
                  {isPending ? "جاري النشر..." : "نشر"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border-t border-border" />

        <div className="flex items-center justify-between pt-1">
          <Button variant="ghost" className="flex-1 items-center justify-center gap-2 h-10 text-muted-foreground rounded-lg hover:bg-secondary transition">
            <Video className="h-6 w-6 text-red-500" />
            <span className="font-medium text-[14px]">فيديو بث مباشر</span>
          </Button>

          <Button variant="ghost" className="flex-1 items-center justify-center gap-2 h-10 text-muted-foreground rounded-lg hover:bg-secondary transition">
            <Image className="h-6 w-6 text-green-500" />
            <span className="font-medium text-[14px]">صورة/فيديو</span>
          </Button>

          <Button variant="ghost" className="flex-1 items-center justify-center gap-2 h-10 text-muted-foreground rounded-lg hover:bg-secondary transition hidden sm:flex">
            <Smile className="h-6 w-6 text-yellow-500" />
            <span className="font-medium text-[14px]">شعور/نشاط</span>
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}