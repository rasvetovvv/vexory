/*
  Loading placeholders for route transitions (loading.tsx files).
  Shapes approximate the page they stand in for; the shimmer lives in
  globals.css (.skeleton) and stops under prefers-reduced-motion.
*/

export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div aria-hidden className={`skeleton rounded-md ${className}`} style={style} />
  );
}

/** A glass card with an avatar row + text lines — feed items, list rows. */
export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="mt-1.5 h-3 w-24" />
        </div>
      </div>
      {lines > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {Array.from({ length: lines }).map((_, i) => (
            // Vary widths so the block doesn't read as a barcode
            <Skeleton key={i} className="h-3" style={{ width: `${88 - i * 16}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Page header: title + optional chip row, matching list pages. */
export function SkeletonPageHeader({ chips = 0 }: { chips?: number }) {
  return (
    <div>
      <Skeleton className="h-8 w-44" />
      {chips > 0 && (
        <div className="mt-4 flex gap-2 overflow-hidden">
          {Array.from({ length: chips }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
          ))}
        </div>
      )}
    </div>
  );
}

export function SkeletonList({
  count = 5,
  lines = 2,
}: {
  count?: number;
  lines?: number;
}) {
  return (
    <div className="mt-5 flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={lines} />
      ))}
    </div>
  );
}
