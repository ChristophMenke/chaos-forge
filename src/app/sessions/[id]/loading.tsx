import { Skeleton } from "@/components/ui/skeleton";

export default function SessionDetailLoading() {
  return (
    <div className="w-full p-6">
      <div className="mb-6 flex items-start justify-between">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="mb-4 h-48 w-full rounded-xl" />
      <Skeleton className="mb-4 h-8 w-48" />
      <Skeleton className="mb-6 h-6 w-full" />
      {[1, 2].map((i) => (
        <Skeleton key={i} className="mb-4 h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}
