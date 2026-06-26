import PresenceInitializer from "@/features/online/components/PresenceInitializer";
import OfflineBanner from "@/components/shared/OfflineBanner";

export const metadata = {
  title: "Socially | المحادثات الخاصة",
  description: "تواصل مع أصدقائك في الوقت الفعلي من خلال ميزة الدردشة الخاصة بنا.",
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <PresenceInitializer />
      <OfflineBanner />
      {children}
    </div>
  );
}
