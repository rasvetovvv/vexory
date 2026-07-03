import {
  SkeletonCard,
  SkeletonList,
  SkeletonPageHeader,
} from "@/components/ui/skeleton";

export default function FeedLoading() {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <SkeletonPageHeader chips={6} />
        <div className="mt-5">
          <SkeletonCard lines={1} />
        </div>
        <SkeletonList count={5} lines={2} />
      </div>
      <aside className="hidden flex-col gap-6 xl:flex">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </aside>
    </div>
  );
}
