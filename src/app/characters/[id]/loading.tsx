import { Skeleton } from "@/components/ui/skeleton";

export default function CharacterLoading() {
  return (
    <div className="w-full p-6">
      <div className="mb-6 flex items-start gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-9 w-64" />
          <div className="mt-2 flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
