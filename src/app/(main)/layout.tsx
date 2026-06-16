import Navbar from "@/components/shared/Navbar";
import Sidebar from "@/components/shared/Sidebar";
import { requireUser } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/server";
import OfflineBanner from "@/components/shared/OfflineBanner";
import PresenceInitializer from "@/features/online/components/PresenceInitializer";
import { searchProfilesAction } from "@/features/search/actions";
import { fetchNotificationsAction, markNotificationsAsReadAction } from "@/features/notifications/actions";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();
  const profile = await getProfile(user.id);

  return (
    <div className="min-h-screen bg-background ">
      <PresenceInitializer />
      <OfflineBanner />
      <Navbar 
        user={profile} 
        onSearchAction={searchProfilesAction} 
        onFetchNotifications={fetchNotificationsAction}
        onMarkNotificationsAsRead={markNotificationsAsReadAction}
      />
      <div className="flex justify-between items-start w-full max-w-[1440px] mx-auto gap-4 lg:px-4 pt-4">
        <Sidebar user={profile} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}