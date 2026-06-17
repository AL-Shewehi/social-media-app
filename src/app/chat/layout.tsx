import PresenceInitializer from "@/features/online/components/PresenceInitializer";
import OfflineBanner from "@/components/shared/OfflineBanner";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <PresenceInitializer />
      <OfflineBanner />
      {children}
    </div>
  );
}
