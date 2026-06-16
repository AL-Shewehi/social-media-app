import { MessageCircle } from "lucide-react";

export const metadata = {
  title: "Socially | المحادثات الخاصة",
};

export default function ChatIndexPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground w-full">
      <div className="h-24 w-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6 border border-border">
        <MessageCircle className="h-12 w-12 text-muted-foreground opacity-50" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">رسائلك الخاصة</h3>
      <p className="text-sm max-w-sm text-center">
        اختر محادثة من القائمة الجانبية أو ابدأ محادثة جديدة للتواصل مع أصدقائك.
      </p>
    </div>
  );
}