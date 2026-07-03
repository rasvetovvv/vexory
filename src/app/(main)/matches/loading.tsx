import { SkeletonList, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function MatchesLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <SkeletonPageHeader />
      <SkeletonList count={5} lines={1} />
    </div>
  );
}
