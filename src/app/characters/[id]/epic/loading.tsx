import { Skeleton } from "@/components/ui/skeleton";

export default function EpicEquipmentLoading() {
  return (
    <div className="flex w-full flex-col gap-6 p-4 sm:p-6" data-testid="epic-loading">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
            <Skeleton className="mt-4 h-8 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
