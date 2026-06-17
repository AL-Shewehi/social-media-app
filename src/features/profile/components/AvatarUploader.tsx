"use client";

import { useRef, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarAction } from "@/features/profile/actions";
import { toast } from "sonner";

interface AvatarUploaderProps {
  currentAvatarUrl: string | null;
  fallbackLetter: string;
  // دالة نمررها عشان نقول للكومبوننت الأب "أنا برفع صورة دلوقتي، اقفل زرار الحفظ"
  onUploadStateChange?: (isUploading: boolean) => void;
}

export default function AvatarUploader({
  currentAvatarUrl,
  fallbackLetter,
  onUploadStateChange,
}: AvatarUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الصورة الشخصية يجب ألا يتجاوز 2 ميجابايت");
      return;
    }

    setIsUploading(true);
    onUploadStateChange?.(true); // إبلاغ الأب

    const localPreviewUrl = URL.createObjectURL(file);
    setAvatarPreview(localPreviewUrl);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("لم يتم العثور على حساب المستخدم");

      const fileExt = file.name.split(".").pop();
      const uniqueId = crypto.randomUUID();
      const filePath = `${user.id}/avatar_${uniqueId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const result = await updateAvatarAction(publicUrl);

      if (result.success) {
        toast.success("تم تحديث صورتك الشخصية بنجاح! 📸");
        setAvatarPreview(publicUrl);
      } else {
        throw new Error(result.error);
      }
    } catch (error: unknown) {
      console.error("Avatar upload error:", error);
      toast.error(error instanceof Error ? error.message : "فشل رفع الصورة الشخصية");
      setAvatarPreview(currentAvatarUrl);
    } finally {
      setIsUploading(false);
      onUploadStateChange?.(false); // إبلاغ الأب بانتهاء الرفع
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="relative group">
        <Avatar className="h-24 w-24 border-2 border-border shadow-inner">
          <AvatarImage src={avatarPreview ?? undefined} />
          <AvatarFallback className="bg-primary text-white font-bold text-2xl">
            {fallbackLetter}
          </AvatarFallback>
        </Avatar>

        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-50 cursor-pointer"
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </button>
      </div>
      <span className="text-xs text-muted-foreground">
        اضغط على الصورة لتغييرها
      </span>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        accept="image/*"
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}