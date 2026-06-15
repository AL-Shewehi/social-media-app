import type { Profile } from "@/types/database.types";

// الفحص النوعي: التأكد من أن الكائن يحتوي على الخصائص الأساسية المطلوبة
function isValidProfile(obj: unknown): obj is Profile {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    typeof obj.id === "string"
  );
}

export function normalizeProfile(profiles: unknown): Profile | null {
  if (!profiles) return null;

  // استخراج العنصر الأول لو كان مصفوفة، أو استخدام الكائن مباشرة
  const profileData = Array.isArray(profiles) ? profiles[0] : profiles;

  // التأكد من صحة الكائن
  if (!isValidProfile(profileData)) {
    return null;
  }

  //  إعادة بناء الـ Object (Sanitization) لمنع تسريب أي بيانات إضافية غير مرغوب فيها
  return {
    id: profileData.id,
    full_name: profileData.full_name ?? null,
    avatar_url: profileData.avatar_url ?? null,
  } as Profile;
}