"use client";

import { useRef, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Image, Smile, Video, X } from "lucide-react";
import { createPostAction } from "@/features/feed/actions";
import { toast } from "sonner";
import type { Profile } from "@/types/database.types";
import { createClient } from "@/lib/supabase/client";

interface CreatePostDialogProps {
  user: Profile | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sharedPostId?: string;
}

export default function CreatePostDialog({
  user,
  isOpen,
  onOpenChange,
  sharedPostId,
}: CreatePostDialogProps) {
  const [postText, setPostText] = useState("");
  const [isPending, setIsPending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const Author = user?.full_name || "مستخدم مجهول";
  const firstName = Author?.split(" ")[0];
  const fallbackLetter = Author.charAt(0).toUpperCase();

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast.error("حجم الصورة يجب ألا يتجاوز 4 ميجا بايت");
        return;
      }
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeSelectedImage = () => {
    setSelectedFile(null);
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = (val: boolean) => {
    onOpenChange(val);
    if (!val) {
      removeSelectedImage();
      setPostText("");
    }
  };

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 ميجابايت
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (file.size > MAX_FILE_SIZE) {
      toast.error("حجم الصورة يجب ألا يتجاوز 4 ميجا بايت");
      return null;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(
        "صيغة الصورة يجب ان تكون jpeg, png, webp, gif",
      );
      return null;
    }

    const supabase = createClient();

    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("post_images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error(`Error uploading image: ${error.message}`);
      return null;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("post_images").getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim() && !selectedFile && !sharedPostId) return;

    setIsPending(true);
    let uploadedImageUrl: string | null = null;

    try {
      if (selectedFile) {
        uploadedImageUrl = await uploadImageToStorage(selectedFile);
        if (!uploadedImageUrl) {
          toast.error("فشل رفع الصورة، جاري نشر النص فقط");
        }
      }

      // 👈 تم إضافة الـ sharedPostId هنا
      const result = await createPostAction(
        postText,
        uploadedImageUrl,
        sharedPostId,
      );

      if (result.success) {
        toast.success(
          sharedPostId ? "تمت المشاركة بنجاح!" : "تم نشر منشورك بنجاح!",
        );
        setPostText("");
        removeSelectedImage();
        onOpenChange(false);
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-card border rounded-xl">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-center font-bold text-lg">
            {sharedPostId ? "مشاركة المنشور" : "إنشاء منشور"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            شارك أفكارك مع العالم!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={user?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-white font-bold">
                {fallbackLetter}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-sm">{Author}</h4>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md mt-0.5 inline-block">
                العامة
              </span>
            </div>
          </div>

          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder={
              sharedPostId
                ? "قل شيئاً عن هذا المنشور..."
                : `بم تفكر يا ${firstName}؟`
            }
            className="w-full min-h-[120px] bg-transparent resize-none text-foreground placeholder:text-muted-foreground focus:outline-none text-[16px]"
            dir="auto"
            disabled={isPending}
          />

          {imagePreview && (
            <div className="relative rounded-lg overflow-hidden border border-border bg-secondary/30 max-h-[250px]">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover max-h-[250px]"
              />
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

          {/*  أضفنا ID للـ Input عشان نقدر نفتحه من بره الكومبوننت لو حبينا */}
          <input
            id="post-image-input"
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />

          <div className="flex items-center justify-between border border-border p-2 rounded-lg bg-background/50">
            <span className="text-sm font-medium px-2 text-foreground">
              إضافة إلى منشورك
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="text-emerald-500 rounded-full h-9 w-9 hover:bg-secondary"
              >
                <Image className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-red-500 rounded-full h-9 w-9 hover:bg-secondary"
              >
                <Video className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-amber-500 rounded-full h-9 w-9 hover:bg-secondary"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={
              (!postText.trim() && !selectedFile && !sharedPostId) || isPending
            }
            className="w-full h-10 font-semibold rounded-lg"
          >
            {isPending ? "جاري النشر..." : "نشر"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
