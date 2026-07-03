import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      {/* Hero */}
      <div className="glass rounded-xl p-6 md:p-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-xl" />
          <div>
            <Skeleton className="h-7 w-52" />
            <Skeleton className="mt-2 h-3.5 w-72 max-w-full" />
          </div>
        </div>
        <Skeleton className="mt-5 h-3" style={{ width: "80%" }} />
        <Skeleton className="mt-2 h-3" style={{ width: "62%" }} />
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <Skeleton className="h-6 w-32" />
          <SkeletonList count={3} lines={2} />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-6 w-24" />
          <SkeletonList count={2} lines={0} />
        </div>
      </div>
    </div>
  );
}
