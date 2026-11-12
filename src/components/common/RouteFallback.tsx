import { Skeleton } from '@/components/ui';

/**
 * Suspense fallback that mirrors the shape of a dashboard page,
 * so route chunks load without a blank flash.
 */
export default function RouteFallback() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border/60 bg-card/60 p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-11 w-11 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border/60 bg-card/60 p-6">
            <Skeleton className="mb-5 h-5 w-40" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}