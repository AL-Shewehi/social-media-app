import Navbar from "@/components/shared/Navbar";
import Sidebar from "@/components/shared/Sidebar";
import { requireUser } from "@/features/auth/actions";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

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