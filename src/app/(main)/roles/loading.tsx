import { SkeletonList, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function RolesLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <SkeletonPageHeader chips={5} />
      <SkeletonList count={6} lines={1} />
    </div>
  );
}
