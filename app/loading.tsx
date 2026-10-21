import { CardsSkeleton, Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-48" />
      <CardsSkeleton />
    </div>
  );
}
