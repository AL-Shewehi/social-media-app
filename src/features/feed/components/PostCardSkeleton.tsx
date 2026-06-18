import { Skeleton } from "@/components/ui/skeleton";

export default function PostCardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 p-4 border rounded-xl bg-card mb-4">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-37.5" />
          <Skeleton className="h-3 w-37.5" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-50 w-full rounded-xl" />
      <div className="flex gap-4 pt-2">
        <Skeleton className="h-8 w-20 flex-1" />
        <Skeleton className="h-8 w-20 flex-1" />
        <Skeleton className="h-8 w-20 flex-1" />
      </div>
    </div>
  );
}