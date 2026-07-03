/*
  Build-log activity over the last 12 weeks, GitHub-contribution style.
  Server component — pure render from entry dates already loaded on the page.
  "Activity reads like a log": the graph gives followers an instant read on
  whether a project is alive without scrolling the build log.
*/

const WEEKS = 12;
const DAY_MS = 24 * 3600 * 1000;

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

// Violet intensity ramp: empty cells are barely-raised surface, active cells
// step up in brand color. Text alternatives carry the exact counts.
const ramp = [
  "rgba(255, 255, 255, 0.045)",
  "rgba(124, 92, 255, 0.32)",
  "rgba(124, 92, 255, 0.6)",
  "#7c5cff",
];

export function ActivityGraph({ dates }: { dates: Date[] }) {
  const today = startOfDay(new Date());
  // Grid ends on today's column; pad the last week so columns are full.
  const daysSinceMonday = (today.getDay() + 6) % 7;
  const gridEnd = today.getTime() + (6 - daysSinceMonday) * DAY_MS;
  const gridStart = gridEnd - (WEEKS * 7 - 1) * DAY_MS;

  const counts = new Map<number, number>();
  for (const date of dates) {
    const day = startOfDay(date).getTime();
    if (day >= gridStart && day <= today.getTime()) {
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
  }

  // Streak: consecutive weeks (ending this week) with at least one update.
  let streak = 0;
  for (let w = WEEKS - 1; w >= 0; w--) {
    const weekStart = gridStart + w * 7 * DAY_MS;
    let active = false;
    for (let d = 0; d < 7; d++) {
      if ((counts.get(weekStart + d * DAY_MS) ?? 0) > 0) {
        active = true;
        break;
      }
    }
    if (active) streak++;
    // The current (still in progress) week being empty doesn't break it.
    else if (w !== WEEKS - 1) break;
  }

  const total = dates.filter(
    (d) => startOfDay(d).getTime() >= gridStart,
  ).length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div
        role="img"
        aria-label={`${total} build log updates in the last ${WEEKS} weeks`}
        className="grid grid-flow-col gap-[3px]"
        style={{ gridTemplateRows: "repeat(7, 10px)" }}
      >
        {Array.from({ length: WEEKS * 7 }).map((_, i) => {
          const week = Math.floor(i / 7);
          const day = i % 7;
          const time = gridStart + (week * 7 + day) * DAY_MS;
          const future = time > today.getTime();
          const count = counts.get(time) ?? 0;
          const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3;
          return (
            <span
              key={i}
              title={
                future
                  ? undefined
                  : `${new Date(time).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}: ${count} update${count === 1 ? "" : "s"}`
              }
              className="h-[10px] w-[10px] rounded-[2px]"
              style={{
                gridColumn: week + 1,
                gridRow: day + 1,
                background: future ? "transparent" : ramp[level],
              }}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-wider text-faint">
        <span>
          <span className="text-foreground">{total}</span> update
          {total === 1 ? "" : "s"} · 12w
        </span>
        {streak > 1 && (
          <span className="text-accent">{streak}-week streak</span>
        )}
      </div>
    </div>
  );
}
