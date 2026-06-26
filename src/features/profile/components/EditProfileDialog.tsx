"use client";

import { useState } from "react";
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
import { Loader2, Save, Edit2 } from "lucide-react";
import { updateProfileAction } from "@/features/profile/actions";
import { toast } from "sonner";
import type { Profile } from "@/types/database.types";
import AvatarUploader from "./AvatarUploader";

interface EditProfileDialogProps {
  userProfile: Profile;
}

export default function EditProfileDialog({
  userProfile,
}: EditProfileDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fullName, setFullName] = useState(userProfile.full_name || "");
  const [isPending, setIsPending] = useState(false);

  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  const fallbackLetter = fullName.charAt(0).toUpperCase() || "?";

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

  const isFormDisabled = isPending || isAvatarUploading;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-lg font-medium shadow-sm mb-2 cursor-pointer">
          <Edit2 className="h-4 w-4" />
          <span>تعديل الملف الشخصي</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25 p-0 overflow-hidden bg-card border rounded-xl">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-center font-bold text-lg">
            تعديل الملف الشخصي
          </DialogTitle>
          <DialogDescription className="sr-only">
            تعديل الاسم والصورة الشخصية الخاصة بحسابك على الشبكة.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <AvatarUploader
            currentAvatarUrl={userProfile.avatar_url}
            fallbackLetter={fallbackLetter}
            onUploadStateChange={setIsAvatarUploading}
          />

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              الاسم الكامل
            </label>
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="اكتب اسمك الكامل..."
              className="h-10 rounded-lg bg-background border"
              dir="auto"
              required
              disabled={isFormDisabled}
            />
          </div>

          <div className="flex items-center gap-2 justify-end border-t pt-4 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isFormDisabled}
              className="rounded-lg h-10 font-medium"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isFormDisabled || !fullName.trim()}
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
