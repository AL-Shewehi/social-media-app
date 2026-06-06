import Navbar from "@/components/shared/Navbar";
import Sidebar from "@/components/shared/Sidebar";
import { requireUser } from "@/features/auth/actions";
import { getProfile } from "@/lib/supabase/server";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const profile = await getProfile(user.id);

  return (
    <div className="min-h-screen bg-background ">
      <Navbar user={profile} />
      <div className="flex justify-between w-full max-w-[1440px] mx-auto gap-4 lg:px-4 pt-4">
        <Sidebar user={profile} />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
