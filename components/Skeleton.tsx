export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-line/70 ${className}`} aria-hidden />;
}

export function CardsSkeleton({ n = 3 }: { n?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3" role="status" aria-label="লোড হচ্ছে">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-3xl border border-line bg-white">
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ n = 4 }: { n?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="লোড হচ্ছে">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-3xl border border-line bg-white p-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
