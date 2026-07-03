import { SkeletonList, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      <SkeletonPageHeader chips={6} />
      <SkeletonList count={6} lines={2} />
    </div>
  );
}
