import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-[60vh] w-full rounded-lg" />
    </div>
  );
}
