import FeedPosts from "@/features/feed/components/FeedPosts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";
import EditProfileDialog from "@/features/profile/components/EditProfileDialog";
import CreatePost from "@/features/feed/components/CreatePost";
import FriendshipButton from "@/features/friends/components/FriendshipButton";
import FeedErrorBoundary from "@/components/shared/FeedErrorBoundary";
import { getProfilePageData } from "@/features/profile/actions";
import MessageButton from "@/features/chat/components/MessageButton";

export const metadata = {
    title: "Socially | الملف الشخصي",
    description: "عرض الملف الشخصي لمستخدم على Socially.",
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id: profileUserId } = await params;

  if (!profileUserId || !UUID_REGEX.test(profileUserId)) {
    return (
      <div className="text-center py-20 text-muted-foreground bg-card border rounded-xl max-w-2xl mx-auto mt-10">
        معرف الحساب غير صالح أو غير صحيح. 🔍
      </div>
    );
  }

  // 2. جلب البيانات من الداتابيز
  const {
    targetProfile,
    formattedPosts,
    friendshipData,
    isMyOwnProfile,
    currentUser,
    error,
  } = await getProfilePageData(profileUserId);

  // معالجة الأخطاء (لو الحساب مش موجود أو حصل خطأ في الداتابيز)
  if (error || !targetProfile || !currentUser) {
    return (
      <div className="text-center py-20 text-muted-foreground bg-card border rounded-xl max-w-2xl mx-auto mt-10">
        {error || "حدث خطأ غير متوقع. 🔍"}
      </div>
    );
  }

  const fullName = targetProfile.full_name || "مستخدم مجهول";
  const fallbackLetter = fullName.charAt(0).toUpperCase();

  return (
    <div className="w-full max-w-6xl mx-auto px-4  space-y-6 select-none">
      {/* ─── الكارد العلوي للبروفايل ─── */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="h-40 md:h-52 bg-linear-to-r from-primary/20 via-primary/10 to-secondary" />

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

          {isMyOwnProfile ? (
            <EditProfileDialog userProfile={targetProfile} />
          ) : (
            <div>
              <MessageButton targetUserId={profileUserId} variant="outline" />

              <FriendshipButton
                targetUserId={profileUserId}
                currentUserId={currentUser.id}
                initialFriendship={friendshipData}
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── الجزء السفلي ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1 bg-card border rounded-xl p-4 space-y-3 shadow-sm lg:sticky top-20">
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
          <FeedErrorBoundary>
            <FeedPosts
              initialPosts={formattedPosts || []}
              currentUserId={currentUser.id}
              currentUserProfile={targetProfile}
              profileUserId={profileUserId}
            />
          </FeedErrorBoundary>
        </div>
      </div>
    </div>
  );
}
