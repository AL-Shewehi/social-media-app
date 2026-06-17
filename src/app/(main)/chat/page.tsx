import ConversationList from "@/features/chat/components/ConversationList";

export const metadata = {
  title: "Socially | المحادثات الخاصة",
};

export default function ChatIndexPage() {
  return (
    <div className="h-full">
      <ConversationList />
    </div>
  );
}
