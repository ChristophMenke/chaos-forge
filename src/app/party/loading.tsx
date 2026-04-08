import { Skeleton } from "@/components/ui/skeleton";

export default function PartyLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-12 w-64 rounded-lg" />
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  );
}
