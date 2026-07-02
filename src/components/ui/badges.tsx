import { statusLabels, compensationLabels } from "@/lib/format";

const statusStyles: Record<string, string> = {
  IDEA: "bg-info-muted text-info",
  BUILDING: "bg-primary-muted text-accent",
  MVP_LAUNCHED: "bg-success-muted text-success",
  LAUNCHED: "bg-success-muted text-success",
  PAUSED: "bg-warning-muted text-warning",
  ACQUIRED: "bg-info-muted text-info",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider ${statusStyles[status] ?? "bg-glass text-muted"}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status] ?? status}
    </span>
  );
}

export function CompensationBadge({ compensation }: { compensation: string }) {
  return (
    <span className="inline-flex rounded-full border border-border bg-glass px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
      {compensationLabels[compensation] ?? compensation}
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-glass px-2.5 py-0.5 text-xs text-muted">
      #{children}
    </span>
  );
}
