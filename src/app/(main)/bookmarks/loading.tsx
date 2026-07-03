import { SkeletonList, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function BookmarksLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <SkeletonPageHeader />
      <SkeletonList count={5} lines={1} />
    </div>
  );
}
