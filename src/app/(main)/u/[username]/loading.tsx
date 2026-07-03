import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="glass rounded-xl p-6 md:p-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="mt-2 h-3.5 w-32" />
          </div>
        </div>
        <Skeleton className="mt-5 h-3" style={{ width: "70%" }} />
      </div>
      <SkeletonList count={4} lines={2} />
    </div>
  );
}
