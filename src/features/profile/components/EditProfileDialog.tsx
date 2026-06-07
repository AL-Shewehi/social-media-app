"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Save } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { updateProfileAction, updateAvatarAction } from "../actions";
import { toast } from "sonner";

interface EditProfileDialogProps {
  userProfile: {
    full_name: string | null;
    avatar_url: string | null;
  };
  trigger: React.ReactNode;
}

export default function EditProfileDialog({ userProfile, trigger }: EditProfileDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fullName, setFullName] = useState(userProfile.full_name || "");
  const [isPending, setIsPending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile.avatar_url);

  const fallbackLetter = fullName.charAt(0).toUpperCase() || "?";

  // ─── 1. دالة معالجة ورفع الصورة الشخصية (Avatar Upload) ───
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الصورة الشخصية يجب ألا يتجاوز 2 ميجابايت");
      return;
    }

    setIsUploading(true);
    
    // إنشاء رابط معاينة مؤقت سريع للـ UI
    const localPreviewUrl = URL.createObjectURL(file);
    setAvatarPreview(localPreviewUrl);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // جلب الـ User ID الحالي أوتوماتيك من المتصفح عشان نرفع في الفولدر الصح الآمن
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("لم يتم العثور على حساب المستخدم");

      const fileExt = file.name.split(".").pop();
      // تخزين الملف بمسار آمن: userId/avatar_timestamp.ext ليتوافق مع الـ RLS Policy بالملي
      const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`;

      // رفع الصورة للـ Bucket المخصص 'avatars'
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      // جلب الـ Public URL للملف المرفوع
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // تحديث السطر في جدول الـ Profiles عبر الـ Server Action
      const result = await updateAvatarAction(publicUrl);

      if (result.success) {
        toast.success("تم تحديث صورتك الشخصية بنجاح! 📸");
        setAvatarPreview(publicUrl);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(error.message || "فشل رفع الصورة الشخصية");
      setAvatarPreview(userProfile.avatar_url); // العودة للصورة القديمة في حال الفشل
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ─── 2. دالة حفظ الاسم الكامل (Save Text Profile) ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim() === userProfile.full_name) {
      setIsOpen(false);
      return;
    }

    setIsPending(true);
    const result = await updateProfileAction(fullName);
    setIsPending(false);

    if (result.success) {
      toast.success("تم تحديث بياناتك الشخصية بنجاح!");
      setIsOpen(false);
    } else {
      toast.error(result.error || "حدث خطأ أثناء حفظ البيانات");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-card border rounded-xl">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-center font-bold text-lg">تعديل الملف الشخصي</DialogTitle>
          <DialogDescription className="sr-only">
            تعديل الاسم والصورة الشخصية الخاصة بحسابك على الشبكة.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* قسم الـ Avatar الحركي */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-border shadow-inner">
                <AvatarImage src={avatarPreview ?? undefined} />
                <AvatarFallback className="bg-primary text-white font-bold text-2xl">
                  {fallbackLetter}
                </AvatarFallback>
              </Avatar>
              
              {/* زر الكاميرا الشفاف فوق الصورة */}
              <button
                type="button"
                disabled={isUploading || isPending}
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
            <span className="text-xs text-muted-foreground">اضغط على الصورة لتغييرها</span>
            
            {/* حقل اختيار ملف الـ Avatar المخفي */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
              disabled={isUploading || isPending}
            />
          </div>

          {/* حقل تعديل الاسم الكامل */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">الاسم الكامل</label>
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="اكتب اسمك الكامل..."
              className="h-10 rounded-lg bg-background border"
              dir="auto"
              required
              disabled={isPending || isUploading}
            />
          </div>

          {/* أزرار التحكم السفلي */}
          <div className="flex items-center gap-2 justify-end border-t pt-4 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending || isUploading}
              className="rounded-lg h-10 font-medium"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isPending || isUploading || !fullName.trim()}
              className="rounded-lg h-10 font-medium gap-2 px-5 shadow-sm"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>حفظ التغييرات</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}