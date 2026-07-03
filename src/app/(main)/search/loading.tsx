import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-4 h-12 w-full rounded-lg" />
      <SkeletonList count={4} lines={1} />
    </div>
  );
}
