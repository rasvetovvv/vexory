import type { MomentumBadge } from "@/lib/momentum";

const tones: Record<MomentumBadge["tone"], string> = {
  success: "bg-success-muted text-success",
  accent: "bg-primary-muted text-accent",
  info: "bg-info-muted text-info",
  warning: "bg-warning-muted text-warning",
};

/** Activity-earned pills ("Shipping weekly", "Hiring now"…), StatusBadge grammar. */
export function MomentumBadges({
  badges,
  size = "md",
}: {
  badges: MomentumBadge[];
  size?: "sm" | "md";
}) {
  if (badges.length === 0) return null;
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]";
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {badges.map((b) => (
        <span
          key={b.key}
          className={`inline-flex rounded-full font-mono font-bold uppercase tracking-wider ${pad} ${tones[b.tone]}`}
        >
          {b.label}
        </span>
      ))}
    </span>
  );
}
