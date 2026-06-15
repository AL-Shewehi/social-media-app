import Link from "next/link";
import UserCard from "./UserCard";
import type { Profile } from "@/types/database.types";

export default function SuggestedFriendsSection({ suggestedFriends, currentUserId }: { suggestedFriends: Profile[], currentUserId: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-foreground">أشخاص قد تعرفهم</h3>
        <Link href="#" className="text-sm text-primary hover:underline font-medium">
          عرض الكل
        </Link>
      </div>

      {suggestedFriends && suggestedFriends.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {suggestedFriends.map((profile) => (
            <UserCard
              key={profile.id}
              profile={profile}
              currentUserId={currentUserId}
              subtitle="اقتراح لك"
              friendship={null} 
            />
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">لا توجد اقتراحات حالياً.</div>
      )}
    </div>
  );
}