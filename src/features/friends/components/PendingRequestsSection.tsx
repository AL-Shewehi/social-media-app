import Link from "next/link";
import UserCard from "./UserCard";
import type { Profile } from "@/types/database.types";

interface PendingRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  sender: Profile | null;
}

export default function PendingRequestsSection({ pendingRequests, currentUserId }: { pendingRequests: PendingRequest[], currentUserId: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-foreground">طلبات الصداقة</h3>
        <Link href="#" className="text-sm text-primary hover:underline font-medium">
          عرض الكل
        </Link>
      </div>

      {pendingRequests && pendingRequests.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {pendingRequests.map((req) => (
            <UserCard
              key={req.id}
              profile={req.sender}
              currentUserId={currentUserId}
              subtitle="أرسل لك طلب صداقة"
              friendship={{
                id: req.id,
                sender_id: req.sender_id,
                receiver_id: req.receiver_id,
                status: req.status as "pending",
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">لا توجد طلبات صداقة حالياً.</div>
      )}
    </div>
  );
}