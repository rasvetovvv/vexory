import { SkeletonCard, SkeletonPageHeader } from "@/components/ui/skeleton";

export default function PeopleLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      <SkeletonPageHeader chips={7} />
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} lines={0} />
        ))}
      </div>
    </div>
  );
}
