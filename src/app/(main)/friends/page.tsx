import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Settings, UserPlus, Users, ChevronLeft, Gift, UserCheck } from "lucide-react";
import Link from "next/link";
import FriendshipButton from "@/features/friends/components/FriendshipButton";

export default async function FriendsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  // جلب طلبات الصداقة الواردة (Pending)
  const { data: pendingRequests } = await supabase
    .from("friendships")
    .select("id, sender_id, receiver_id, status, sender:profiles!friendships_sender_id_fkey(id, full_name, avatar_url)")
    .eq("status", "pending")
    .eq("receiver_id", user.id);

  // جلب الأصدقاء الحاليين (Accepted)
  const { data: acceptedFriendships } = await supabase
    .from("friendships")
    .select("id, sender_id, receiver_id, status, sender:profiles!friendships_sender_id_fkey(id, full_name, avatar_url), receiver:profiles!friendships_receiver_id_fkey(id, full_name, avatar_url)")
    .eq("status", "accepted")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  const myFriends = acceptedFriendships?.map((f) => {
    const friendProfile = f.sender_id === user.id ? f.receiver : f.sender;
    return {
      friendshipId: f.id,
      rawFriendship: { id: f.id, sender_id: f.sender_id, receiver_id: f.receiver_id, status: f.status },
      profile: friendProfile as any,
    };
  }) ?? [];

  return (
    <div className="flex w-full min-h-[calc(100vh-56px)] bg-background select-none" dir="rtl">
      
      {/* ─── السايدبار الجانبي (الأصدقاء) ─── */}
      <aside className="hidden lg:flex flex-col w-[360px] bg-card border-l border-border/60 p-4 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto shadow-sm z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">الأصدقاء</h2>
          <div className="p-2 bg-secondary rounded-full cursor-pointer hover:bg-secondary/80 transition">
            <Settings className="h-5 w-5 text-foreground" />
          </div>
        </div>

        <nav className="space-y-1">
          <Link href="/friends" className="flex items-center gap-3 p-3 bg-secondary rounded-lg font-medium text-foreground">
            <div className="p-2 bg-[#0866ff] text-white rounded-full">
              <UserPlus className="h-5 w-5" />
            </div>
            الصفحة الرئيسية
          </Link>
          {[
            { icon: UserPlus, label: "طلبات الصداقة" },
            { icon: UserPlus, label: "الاقتراحات" },
            { icon: Users, label: "كل الأصدقاء" },
          ].map((item, i) => (
            <Link key={i} href="#" className="flex items-center justify-between p-3 hover:bg-secondary rounded-lg font-medium text-foreground transition group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary group-hover:bg-background rounded-full transition">
                  <item.icon className="h-5 w-5 text-foreground" />
                </div>
                {item.label}
              </div>
              <ChevronLeft className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
            </Link>
          ))}
        </nav>
      </aside>

      {/* ─── المحتوى الرئيسي (شبكة الكروت) ─── */}
      <main className="flex-1 p-6 md:p-8 space-y-10 overflow-x-hidden">
        
        {/* قسم طلبات الصداقة */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-foreground">طلبات الصداقة</h3>
            <Link href="#" className="text-sm text-[#0866ff] hover:underline font-medium">عرض الكل</Link>
          </div>
          
          {pendingRequests && pendingRequests.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {pendingRequests.map((req) => (
                <div key={req.id} className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                  {/* الصورة الكبيرة */}
                  <Link href={`/profile/${req.sender?.id}`}>
                    <div className="aspect-square w-full bg-secondary relative overflow-hidden">
                      {req.sender?.avatar_url ? (
                        <img src={req.sender.avatar_url} alt="avatar" className="object-cover w-full h-full hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-primary/20 to-secondary text-primary text-6xl font-bold">
                          {req.sender?.full_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </Link>
                  {/* بيانات الكارت */}
                  <div className="p-4 flex flex-col items-start">
                    <Link href={`/profile/${req.sender?.id}`} className="font-semibold text-foreground text-md w-full truncate hover:underline text-right">
                      {req.sender?.full_name}
                    </Link>
                    <span className="text-xs text-muted-foreground mt-1">أرسل لك طلب صداقة</span>
                    
                    <FriendshipButton 
                      targetUserId={req.sender_id}
                      currentUserId={user.id}
                      initialFriendship={{
                        id: req.id, sender_id: req.sender_id, receiver_id: req.receiver_id, status: req.status
                      }}
                      isCardView={true} // 👈 تفعيل شكل أزرار فيسبوك المكدسة
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">لا توجد طلبات صداقة حالياً.</div>
          )}
        </div>

        <hr className="border-border/60" />

        {/* قسم كل الأصدقاء */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-foreground">كل الأصدقاء</h3>
            <Link href="#" className="text-sm text-[#0866ff] hover:underline font-medium">عرض الكل</Link>
          </div>
          
          {myFriends.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {myFriends.map((friend) => (
                <div key={friend.friendshipId} className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                  <Link href={`/profile/${friend.profile.id}`}>
                    <div className="aspect-square w-full bg-secondary relative overflow-hidden">
                      {friend.profile.avatar_url ? (
                        <img src={friend.profile.avatar_url} alt="avatar" className="object-cover w-full h-full hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-primary/20 to-secondary text-primary text-6xl font-bold">
                          {friend.profile.full_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-4 flex flex-col items-start">
                    <Link href={`/profile/${friend.profile.id}`} className="font-semibold text-foreground text-md w-full truncate hover:underline text-right">
                      {friend.profile.full_name}
                    </Link>
                    <span className="text-xs text-muted-foreground mt-1">صديق</span>
                    
                    <FriendshipButton 
                      targetUserId={friend.profile.id}
                      currentUserId={user.id}
                      initialFriendship={friend.rawFriendship}
                      isCardView={true} 
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">قائمة أصدقائك فارغة. ابحث عن أشخاص لتبدأ التواصل!</div>
          )}
        </div>

      </main>
    </div>
  );
}