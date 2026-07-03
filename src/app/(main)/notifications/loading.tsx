import { SkeletonList, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <SkeletonPageHeader />
      <SkeletonList count={7} lines={0} />
    </div>
  );
}
