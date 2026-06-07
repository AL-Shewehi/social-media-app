import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database.types";
import RealtimeFeedList from "@/features/feed/components/RealtimeFeedList";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Edit } from "lucide-react";
import { redirect } from "next/navigation";
import EditProfileDialog from "@/features/profile/components/EditProfileDialog";
import CreatePost from "@/features/feed/components/CreatePost";

function normalizeProfile(profiles: unknown): Profile | null {
  if (!profiles) return null;
  if (Array.isArray(profiles)) return (profiles[0] as Profile) ?? null;
  return profiles as Profile;
}

// Next.js App Router بيباصي الـ params أوتوماتيك لصفحات الـ Dynamic Routes
interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  // انتظر الـ params لأنها في النسخ الحديثة من Next.js بقت Promise
  const { id: profileUserId } = await params;

  const supabase = await createServerSupabaseClient();

  // 1.  اليوزر الحالي اللي فاتح المتصفح (عشان نشيك هل ده حسابي ولا حساب حد تاني)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // 2. جلب بيانات صاحب البروفايل (سواء أنا أو يوزر تاني) بناءً على الـ id اللي في الـ URL
  const { data: targetProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", profileUserId)
    .single();

  // لو الـ id اللي في الـ URL غلط أو مش موجود في الداتا بيز
  if (profileError || !targetProfile) {
    console.error("Profile fetch error:", profileError?.message);
    return (
      <div className="text-center py-20 text-muted-foreground bg-card border rounded-xl max-w-2xl mx-auto mt-10">
        هذا الحساب غير موجود أو تم حذفه. 🔍
      </div>
    );
  }

  // 3.  بوستات صاحب هذا البروفايل فقط
  const { data: posts } = await supabase
    .from("posts")
    .select(
      `
      id,
      content,
      created_at,
      user_id,
      image_url,
      profiles!posts_user_id_fkey (
        full_name,
        avatar_url
      ),
      comments (
        id,
        content,
        created_at,
        user_id,
        profiles (
          full_name,
          avatar_url
        )
      ),
      likes (
        post_id,
        user_id
      )
    `,
    )
    .eq("user_id", profileUserId) // فلترة البوستات بناءً على البروفايل المفتوح
    .order("created_at", { ascending: false });

  // 4. تسوية البروفايلات والبيانات
  const formattedPosts =
    posts?.map((post) => ({
      ...post,
      profiles: normalizeProfile(post.profiles),
      comments:
        (post.comments as any[])?.map((c) => ({
          ...c,
          profiles: normalizeProfile(c.profiles),
        })) ?? [],
      likes: (post.likes as any[]) ?? [],
    })) ?? [];

  const fullName = targetProfile.full_name || "مستخدم مجهول";
  const fallbackLetter = fullName.charAt(0).toUpperCase();


  const isMyOwnProfile = user.id === profileUserId;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6 select-none">
      {/* ─── الكارد العلوي للبروفايل ─── */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        {/* الغلاف */}
        <div className="h-40 md:h-52 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary" />

        {/* بيانات المستخدم وصورته */}
        <div className="p-6 relative flex flex-col md:flex-row items-center md:items-end justify-between gap-4 -mt-16 md:-mt-20 border-b border-border/60">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-right">
            <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-card shadow-md">
              <AvatarImage
                src={targetProfile.avatar_url ?? undefined}
                alt={fullName}
              />
              <AvatarFallback className="bg-primary text-white font-bold text-3xl md:text-5xl">
                {fallbackLetter}
              </AvatarFallback>
            </Avatar>
            <div className="mb-2 space-y-1">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                {fullName}
              </h2>
              <div className="flex items-center justify-center md:justify-start gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>عضو في Socially</span>
              </div>
            </div>
          </div>

          {/* زر تعديل الحساب: يظهر فقط وفقط إذا كنت أنا صاحب البروفايل ده */}
          {isMyOwnProfile && (
            <EditProfileDialog
              userProfile={targetProfile}
              trigger={
                <Button className="gap-2 rounded-lg font-medium shadow-sm mb-2 cursor-pointer">
                  <Edit className="h-4 w-4" />
                  <span>تعديل الملف الشخصي</span>
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* ─── الجزء السفلي: النبذة وبوستات اليوزر ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1 bg-card border rounded-xl p-4 space-y-3 shadow-sm sticky top-20">
          <h3 className="font-bold text-lg text-foreground">نبذة شخصية</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isMyOwnProfile
              ? "مرحباً بك في ملفك الشخصي على Socially! تواصل معي وشاركني أفكارك. ✨"
              : `مرحباً بك في ملف الشخصي لـ ${fullName.split(" ")[0]}! تصفح منشورتي وتفاعل معها. ✨`}
          </p>
        </div>

        <div className="lg:col-span-2">
          {isMyOwnProfile && <CreatePost user={targetProfile} />}
          <h3 className="font-bold text-lg text-foreground mb-4">
            {isMyOwnProfile ? "منشوراتي" : `منشورات ${fullName.split(" ")[0]}`}
          </h3>
          <RealtimeFeedList
            initialPosts={formattedPosts}
            currentUserId={user.id}
            currentUserProfile={targetProfile}
          />
        </div>
      </div>
    </div>
  );
}
