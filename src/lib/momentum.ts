/*
  Project momentum — badges earned by real activity, not vanity metrics.
  Callers supply cheap aggregates; nothing here touches the database.
*/

export type MomentumBadge = {
  key: string;
  label: string;
  tone: "success" | "accent" | "info" | "warning";
};

const DAY_MS = 24 * 3600 * 1000;

export function computeMomentum({
  membersCount,
  openRolesCount,
  updatesLast14d,
  lastLaunchAt,
}: {
  membersCount: number;
  openRolesCount: number;
  /** Build log entries in the last 14 days. */
  updatesLast14d: number;
  /** Most recent launch event (status → MVP_LAUNCHED / LAUNCHED), if known. */
  lastLaunchAt?: Date | null;
}): MomentumBadge[] {
  const badges: MomentumBadge[] = [];

  if (updatesLast14d >= 2) {
    badges.push({ key: "shipping", label: "Shipping weekly", tone: "success" });
  }
  if (lastLaunchAt && Date.now() - lastLaunchAt.getTime() < 14 * DAY_MS) {
    badges.push({ key: "launched", label: "Recently launched", tone: "accent" });
  }
  if (openRolesCount > 0) {
    badges.push(
      membersCount <= 1
        ? { key: "forming", label: "Team forming", tone: "warning" }
        : { key: "hiring", label: "Hiring now", tone: "info" },
    );
  }

  return badges;
}
