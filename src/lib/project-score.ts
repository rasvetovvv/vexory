export type ProjectScoreInput = {
  status: string;
  tags: string[];
  description?: string | null;
  websiteUrl?: string | null;
  githubUrl?: string | null;
  _count?: {
    members?: number;
    buildLog?: number;
    openRoles?: number;
    roadmap?: number;
    followedBy?: number;
  };
  roadmap?: { status: string }[];
  buildLog?: { createdAt: Date }[];
  members?: unknown[];
  openRoles?: unknown[];
  followedBy?: unknown[];
};

export type ProjectScore = {
  score: number;
  label: string;
  signals: { label: string; value: number; max: number }[];
};

export function getProjectScore(project: ProjectScoreInput): ProjectScore {
  const memberCount = project._count?.members ?? project.members?.length ?? 0;
  const updateCount = project._count?.buildLog ?? project.buildLog?.length ?? 0;
  const roleCount = project._count?.openRoles ?? project.openRoles?.length ?? 0;
  const followerCount = project._count?.followedBy ?? project.followedBy?.length ?? 0;
  const roadmapCount = project._count?.roadmap ?? project.roadmap?.length ?? 0;
  const doneRoadmap = project.roadmap?.filter((item) => item.status === "DONE").length ?? 0;

  const statusScore: Record<string, number> = {
    IDEA: 6,
    BUILDING: 12,
    MVP_LAUNCHED: 18,
    LAUNCHED: 22,
    ACQUIRED: 22,
    PAUSED: 4,
  };

  const basics = Math.min(14, [project.description, project.websiteUrl, project.githubUrl]
    .filter(Boolean).length * 4 + Math.min(project.tags.length, 4));
  const team = Math.min(18, memberCount * 6 + (roleCount > 0 ? 3 : 0));
  const shipping = Math.min(24, updateCount * 5 + (project.buildLog?.[0] ? 4 : 0));
  const roadmap = Math.min(18, roadmapCount * 3 + doneRoadmap * 4);
  const traction = Math.min(24, followerCount * 3 + (statusScore[project.status] ?? 8));

  const score = Math.max(0, Math.min(100, basics + team + shipping + roadmap + traction));
  const label = score >= 78 ? "Launch-ready" : score >= 55 ? "Gaining signal" : score >= 32 ? "Early build" : "Needs proof";

  return {
    score,
    label,
    signals: [
      { label: "Profile", value: basics, max: 14 },
      { label: "Team", value: team, max: 18 },
      { label: "Shipping", value: shipping, max: 24 },
      { label: "Roadmap", value: roadmap, max: 18 },
      { label: "Traction", value: traction, max: 24 },
    ],
  };
}
