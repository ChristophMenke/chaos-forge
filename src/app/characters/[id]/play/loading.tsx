import { Skeleton } from "@/components/ui/skeleton";

export default function PlayModeLoading() {
  return (
    <div className="w-full" data-testid="play-mode-loading">
      {/* Mode nav */}
      <div className="px-4 pt-3 pb-2">
        <Skeleton className="h-9 w-64" />
      </div>
      {/* HP bar skeleton */}
      <div className="mx-3 rounded-xl border border-border p-3 sm:mx-4 sm:p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full rounded-full" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-14" />
            <Skeleton className="h-10 w-14" />
          </div>
        </div>
      </div>
      {/* Panel nav pills */}
      <div className="flex justify-center gap-1 px-2 py-2 sm:hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
      {/* Panel content */}
      <div className="p-3 sm:hidden">
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
      {/* Desktop 2-column */}
      <div className="hidden gap-4 p-4 sm:grid sm:grid-cols-2">
        <Skeleton className="h-80 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    </div>
  );
}
