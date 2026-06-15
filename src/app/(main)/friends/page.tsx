import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Settings, UserPlus, Users, ChevronLeft, Home } from "lucide-react";
import Link from "next/link";
import { normalizeProfile } from "@/lib/normalize";
import PendingRequestsSection from "@/features/friends/components/PendingRequestsSection";
import MyFriendsSection from "@/features/friends/components/MyFriendsSection";
import SuggestedFriendsSection from "@/features/friends/components/SuggestedFriendsSection";
import { getSuggestedFriendsAction } from "@/features/friends/actions";
import { Profile } from "@/types/database.types";

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const resolvedParams = await searchParams;
  const currentTab = resolvedParams?.tab || "home";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const showRequests = currentTab === "home" || currentTab === "requests";
  const showSuggestions = currentTab === "home" || currentTab === "suggestions";
  const showAllFriends = currentTab === "home" || currentTab === "all";

  type PendingRequestType = {
    id: string;
    sender_id: string;
    receiver_id: string;
    status: string;
    sender: Profile | null;
  };

  type FriendType = {
    friendshipId: string;
    rawFriendship: {
      id: string;
      sender_id: string;
      receiver_id: string;
      status: "accepted";
    };
    profile: Profile | null;
  };

  let pendingRequests: PendingRequestType[] = [];
  let myFriends: FriendType[] = [];
  let suggestedFriends: Profile[] = [];

  if (showRequests) {
    const { data: rawPendingRequests } = await supabase
      .from("friendships")
      .select(
        "id, sender_id, receiver_id, status, sender:profiles!friendships_sender_id_fkey(id, full_name, avatar_url)",
      )
      .eq("status", "pending")
      .eq("receiver_id", user.id);

    pendingRequests = (rawPendingRequests?.map((req) => ({
      ...req,
      sender: normalizeProfile(req.sender),
    })) ?? []) as PendingRequestType[];
  }

  if (showAllFriends) {
    const { data: acceptedFriendships } = await supabase
      .from("friendships")
      .select(
        "id, sender_id, receiver_id, status, sender:profiles!friendships_sender_id_fkey(id, full_name, avatar_url), receiver:profiles!friendships_receiver_id_fkey(id, full_name, avatar_url)",
      )
      .eq("status", "accepted")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    myFriends = (acceptedFriendships?.map((f) => {
      const senderProfile = normalizeProfile(f.sender);
      const receiverProfile = normalizeProfile(f.receiver);
      const friendProfile =
        f.sender_id === user.id ? receiverProfile : senderProfile;

      return {
        friendshipId: f.id,
        rawFriendship: {
          id: f.id,
          sender_id: f.sender_id,
          receiver_id: f.receiver_id,
          status: f.status as "accepted",
        },
        profile: friendProfile,
      };
    }) ?? []) as FriendType[];
  }

  if (showSuggestions) {
    const suggestionsLimit = currentTab === "suggestions" ? 30 : 5;
    const suggestionsResult = await getSuggestedFriendsAction(suggestionsLimit);
    //  حماية إضافية: تأكيد أن البيانات راجعة كمصفوفة وليست undefined
    suggestedFriends =
      suggestionsResult.success && suggestionsResult.data
        ? (suggestionsResult.data as Profile[])
        : [];
  }

  // مصفوفة التابات لسهولة الرسم وتحديد الحالة النشطة
  const navTabs = [
    { id: "home", icon: Home, label: "الصفحة الرئيسية", href: "/friends" },
    {
      id: "requests",
      icon: UserPlus,
      label: "طلبات الصداقة",
      href: "/friends?tab=requests",
    },
    {
      id: "suggestions",
      icon: UserPlus,
      label: "الاقتراحات",
      href: "/friends?tab=suggestions",
    },
    { id: "all", icon: Users, label: "كل الأصدقاء", href: "/friends?tab=all" },
  ];

  return (
    <div
      className="flex w-full min-h-[calc(100vh-56px)] bg-background select-none"
      dir="rtl"
    >
      <main className="flex-1 p-6 md:p-8 space-y-10 overflow-x-hidden">
        <div className="flex flex-col md:flex-row gap-3 md:gap-6 mb-6">
          {navTabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center justify-between p-3 rounded-lg font-medium transition group ${
                  isActive
                    ? "bg-secondary text-foreground"
                    : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full transition ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary group-hover:bg-background text-foreground"
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                  </div>
                  {tab.label}
                </div>
                {!isActive && (
                  <ChevronLeft className="h-5 w-5 opacity-0 group-hover:opacity-100 transition" />
                )}
              </Link>
            );
          })}
        </div>

        {showRequests && (
          <>
            <PendingRequestsSection
              pendingRequests={pendingRequests}
              currentUserId={user.id}
            />
            {currentTab === "home" && <hr className="border-border/60" />}
          </>
        )}

        {showSuggestions && (
          <>
            <SuggestedFriendsSection
              suggestedFriends={suggestedFriends}
              currentUserId={user.id}
            />
            {currentTab === "home" && <hr className="border-border/60" />}
          </>
        )}

        {showAllFriends && (
          <MyFriendsSection myFriends={myFriends} currentUserId={user.id} />
        )}
      </main>
    </div>
  );
}
