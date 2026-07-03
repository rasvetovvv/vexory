/*
  The IDEA → BUILDING → MVP → LAUNCHED track. Position derives from the
  current status (ACQUIRED lights the whole track; PAUSED renders nothing —
  the status badge already says it).
*/

const stages = [
  { key: "IDEA", label: "Idea" },
  { key: "BUILDING", label: "Building" },
  { key: "MVP_LAUNCHED", label: "MVP" },
  { key: "LAUNCHED", label: "Launched" },
];

export function StatusTrack({ status }: { status: string }) {
  if (status === "PAUSED") return null;
  const current =
    status === "ACQUIRED" ? stages.length - 1 : stages.findIndex((s) => s.key === status);
  if (current < 0) return null;

  return (
    <div className="flex items-center" aria-label={`Project stage: ${stages[current].label}`}>
      {stages.map((stage, i) => {
        const reached = i <= current;
        return (
          <div key={stage.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  i === current
                    ? "bg-primary shadow-[0_0_8px_rgba(124,92,255,0.7)]"
                    : reached
                      ? "bg-primary/60"
                      : "border border-border-strong bg-surface"
                }`}
              />
              <span
                className={`font-mono text-[10px] font-bold uppercase tracking-wider ${
                  i === current ? "text-accent" : reached ? "text-muted" : "text-faint"
                }`}
              >
                {stage.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <span
                className={`mx-1.5 mb-5 h-px flex-1 ${
                  i < current ? "bg-primary/50" : "bg-border"
                }`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
