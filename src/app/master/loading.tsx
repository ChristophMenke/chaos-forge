import { Skeleton } from "@/components/ui/skeleton";

export default function MasterLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
