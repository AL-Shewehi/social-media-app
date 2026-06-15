import Link from "next/link";
import UserCard from "./UserCard";
import type { Profile } from "@/types/database.types";

interface Friend {
  friendshipId: string;
  rawFriendship: { id: string; sender_id: string; receiver_id: string; status: "accepted" };
  profile: Profile | null;
}

export default function MyFriendsSection({ myFriends, currentUserId }: { myFriends: Friend[], currentUserId: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-foreground">كل الأصدقاء</h3>
        <Link href="#" className="text-sm text-primary hover:underline font-medium">
          عرض الكل
        </Link>
      </div>

      {myFriends && myFriends.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {myFriends.map((friend) => (
            <UserCard
              key={friend.friendshipId}
              profile={friend.profile}
              currentUserId={currentUserId}
              subtitle="صديق"
              friendship={friend.rawFriendship}
            />
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">قائمة أصدقائك فارغة. ابحث عن أشخاص لتبدأ التواصل!</div>
      )}
    </div>
  );
}