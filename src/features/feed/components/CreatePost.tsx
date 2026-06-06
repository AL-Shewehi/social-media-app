"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Image, Smile, Video, X } from "lucide-react";
import { createPostAction } from "../actions";
import { toast } from "sonner"
import type { Profile } from "@/types/database.types";
import { createBrowserClient } from "@supabase/ssr";
import { useUIStore } from "@/store/useUIStore";

interface CreatePostProps {
  user: Profile | null;
}

export default function CreatePost({ user }: CreatePostProps) {
  const isOpen = useUIStore((state) => state.isCreatePostOpen);
  const setIsOpen = useUIStore((state) => state.setCreatePostOpen);
  const [postText, setPostText] = useState("");
  const [isPending, setIsPending] = useState(false);

  {/* Image Upload State */ }
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const Author = user?.full_name || "مستخدم مجهول";
  const firstName = Author?.split(" ")[0]
  const fallbackLetter = Author.charAt(0).toUpperCase();
  const avatar = user?.avatar_url || undefined

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB in bytes
        toast.error("حجم الصورة يجب الا يتجاوز 4 ميجا بايت")
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const removeSelectedImage = () => {
    setSelectedFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview); // to free up memory
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fileExt = file.name.split(".").pop() // 1. get the extension [ext]
    const fileName = `${crypto.randomUUID()}.${fileExt}` //2. generate a random name for the file using crypto.randomUUID() and the extension  

    const { data, error } = await supabase.storage.from("post_images").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false
    })

    if (error) {
      console.error(`Error uploading image to Supabase: ${error.message}`)
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from("post_images").getPublicUrl(fileName)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim() && !selectedFile) return;

    setIsPending(true);
    let uploadedImageUrl: string | null = null;

    try {
      if (selectedFile) {
        uploadedImageUrl = await uploadImageToStorage(selectedFile);
        if (!uploadedImageUrl) {
          toast.error("فشل رفع الصورة، جاري نشر النص فقط");
        }
      }

      const result = await createPostAction(postText, uploadedImageUrl);

      if (result.success) {
        toast.success("تم نشر منشورك بنجاح!");
        setPostText("");
        removeSelectedImage();
        setIsOpen(false);
      } else {
        toast.error(result.error || "حدث خطأ أثناء النشر");
      }
    } catch (err) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="w-full shadow-sm border rounded-xl bg-card p-4 select-none mb-4">
      <CardContent className="p-0 space-y-4">
        {/* الاختصار الخارجي لفتح الموديل */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={user?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary text-white font-bold">{fallbackLetter}</AvatarFallback>
          </Avatar>
          <Dialog open={isOpen} onOpenChange={(val) => { setIsOpen(val); if (!val) removeSelectedImage(); }}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="flex-1 justify-start h-10 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground text-[15px] px-4 font-normal cursor-pointer">
                بم تفكر يا {firstName.split(" ")[0]}؟
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-card border rounded-xl">
              <DialogHeader className="p-4 border-b">
                <DialogTitle className="text-center font-bold text-lg">إنشاء منشور</DialogTitle>
                <DialogDescription className="sr-only">
                  شارك أفكارك مع العالم!
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={user?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary text-white font-bold">{fallbackLetter}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-sm">{Author}</h4>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md mt-0.5 inline-block">العامة</span>
                  </div>
                </div>

                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder={`بم تفكر يا ${firstName?.split(" ")[0]}؟`}
                  className="w-full min-h-[120px] bg-transparent resize-none text-foreground placeholder:text-muted-foreground focus:outline-none text-[16px]"
                  dir="auto"
                  disabled={isPending}
                />

                {/* ─── حاوية المعاينة (Image Preview Box) ─── */}
                {imagePreview && (
                  <div className="relative rounded-lg overflow-hidden border border-border bg-secondary/30 max-h-[250px]">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover max-h-[250px]" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={removeSelectedImage}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-md"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* حقل اختيار الملف المخفي */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />

                {/* شريط الأدوات السفلي */}
                <div className="flex items-center justify-between border border-border p-2 rounded-lg bg-background/50">
                  <span className="text-sm font-medium px-2 text-foreground">إضافة إلى منشورك</span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()} // 👈 فتح حقل اختيار الصور عند الضغط
                      className="text-emerald-500 rounded-full h-9 w-9 hover:bg-secondary"
                    >
                      <Image className="h-5 w-5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="text-red-500 rounded-full h-9 w-9 hover:bg-secondary"><Video className="h-5 w-5" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="text-amber-500 rounded-full h-9 w-9 hover:bg-secondary"><Smile className="h-5 w-5" /></Button>
                  </div>
                </div>

                <Button type="submit" disabled={(!postText.trim() && !selectedFile) || isPending} className="w-full h-10 font-semibold rounded-lg">
                  {isPending ? "جاري النشر..." : "نشر"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
            onClick={() => { setIsOpen(true); setTimeout(() => fileInputRef.current?.click(), 100); }} // فتح الموديل وتشغيل اختيار الصور فوراً
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
      </CardContent>
    </Card>
  );
}