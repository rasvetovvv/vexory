import { shortDate } from "@/lib/format";

/*
  The project's journey as a compact log: creation, status changes, joins,
  milestones. Assembled by the page from data it already loads — this
  component only renders.
*/

export type TimelineEvent = {
  date: Date;
  label: string;
  kind: "created" | "status" | "member" | "milestone";
};

const kindDot: Record<TimelineEvent["kind"], string> = {
  created: "bg-primary",
  status: "bg-accent",
  member: "bg-info",
  milestone: "bg-success",
};

export function ProjectTimeline({
  events,
  limit = 8,
}: {
  events: TimelineEvent[];
  limit?: number;
}) {
  const shown = [...events]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
  if (shown.length === 0) return null;

  return (
    <ol className="flex flex-col">
      {shown.map((e, i) => (
        <li key={`${e.date.getTime()}-${e.label}`} className="flex gap-3">
          <span className="w-12 shrink-0 pt-px text-right font-mono text-[11px] uppercase tracking-wider text-faint">
            {shortDate(e.date)}
          </span>
          <span className="flex flex-col items-center">
            <span
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${kindDot[e.kind]}`}
            />
            {i < shown.length - 1 && (
              <span className="w-px flex-1 bg-border" aria-hidden />
            )}
          </span>
          <span
            className={`min-w-0 text-sm leading-snug text-muted ${
              i < shown.length - 1 ? "pb-4" : ""
            }`}
          >
            {e.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
