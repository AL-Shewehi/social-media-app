import Link from "next/link";
import FriendshipButton from "@/features/friends/components/FriendshipButton";
import type { Profile } from "@/types/database.types";

export interface RawFriendshipState {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "declined"; 
}

interface UserCardProps {
  profile: Profile | null;
  currentUserId: string;
  subtitle: string;
  friendship: RawFriendshipState | null;
}

export default function UserCard({
  profile,
  currentUserId,
  subtitle,
  friendship,
}: UserCardProps) {
  if (!profile || !profile.id) return null;

  const fallbackLetter = profile.full_name?.charAt(0).toUpperCase() || "?";

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
      <Link href={`/profile/${profile.id}`}>
        <div className="aspect-square w-full bg-secondary relative overflow-hidden">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || "Avatar"}
              className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-linear-to-br from-primary/20 to-secondary text-primary text-6xl font-bold">
              {fallbackLetter}
            </div>
          )}
        </div>
      </Link>
      <div className="p-4 flex flex-col items-start">
        <Link
          href={`/profile/${profile.id}`}
          className="font-semibold text-foreground text-md w-full truncate hover:underline text-right"
        >
          {profile.full_name}
        </Link>
        <span className="text-xs text-muted-foreground mt-1 mb-3">{subtitle}</span>

        <FriendshipButton
          targetUserId={profile.id}
          currentUserId={currentUserId}
          initialFriendship={friendship}
          isCardView={true}
        />
      </div>
    </div>
  );
}