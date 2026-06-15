import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { getProfile, requireUser } from "@/lib/supabase/server";
import Navbar from "@/components/shared/Navbar";
import { searchProfilesAction } from "@/features/search/actions";
import { fetchNotificationsAction, markNotificationsAsReadAction } from "@/features/notifications/actions";

export default async function NotFound() {
    const { user } = await requireUser();
  const profile = await getProfile(user.id);
  return (
    <div className="min-h-screen bg-background ">
      <Navbar
        user={profile}
        onSearchAction={searchProfilesAction}
        onFetchNotifications={fetchNotificationsAction}
        onMarkNotificationsAsRead={markNotificationsAsReadAction}
      />
    <div className="flex flex-col items-center justify-center h-[85vh] p-4 text-center">
      <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-muted-foreground" />
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-3">
        هذا المحتوى غير متوفر حالياً
      </h2>
      <p className="text-muted-foreground max-w-sm mb-8">
        عندما يحدث هذا، عادة ما يكون بسبب قيام المالك بإلغاء مشاركة المحتوى، 
        أو تغيير الأشخاص الذين يمكنهم رؤيته، أو أنه تم حذف المحتوى.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button asChild>
          <Link href="/">العودة للموجز</Link>
        </Button>
      </div>
    </div>
    </div>
  );
}