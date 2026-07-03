import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, Users, Rocket, BriefcaseBusiness } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, Tag, CompensationBadge } from "@/components/ui/badges";
import { FollowProjectButton, FollowUserButton } from "@/components/social/action-buttons";
import { getProjectScore } from "@/lib/project-score";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Matches" };

type ProjectCandidate = Awaited<ReturnType<typeof getProjectCandidates>>[number];
type UserCandidate = Awaited<ReturnType<typeof getPeopleCandidates>>[number];
type RoleCandidate = Awaited<ReturnType<typeof getRoleCandidates>>[number];

export default async function MatchesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const userId = session.user.id;

  const viewer = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { roles: true, skills: true, interests: true, headline: true, openForWork: true },
  });

  const profileTerms = normalizeTerms([
    ...viewer.skills,
    ...viewer.interests,
    ...viewer.roles.map((r) => r.toLowerCase().replaceAll("_", " ")),
  ]);

  const [projectCandidates, peopleCandidates, roleCandidates] = await Promise.all([
    getProjectCandidates(userId),
    getPeopleCandidates(userId),
    getRoleCandidates(userId),
  ]);

  const projectMatches = projectCandidates
    .map((project) => ({ project, match: scoreProject(project, profileTerms) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 8);

  const peopleMatches = peopleCandidates
    .map((user) => ({ user, match: scorePerson(user, profileTerms) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 6);

  const roleMatches = roleCandidates
    .map((role) => ({ role, match: scoreRole(role, profileTerms, viewer.openForWork) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 6);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <section className="glass-deep rounded-2xl p-6 md:p-8">
        <p className="flex w-fit items-center gap-2 rounded-full border border-border bg-glass px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-accent">
          <Sparkles size={14} /> Personalized graph
        </p>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Matches for your next build sprint
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
              Recommendations are ranked from your onboarding roles, skills and interests — projects to follow, people to meet, and roles where you can help.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-faint">Your signal</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profileTerms.slice(0, 12).map((term) => (
                <Tag key={term}>{term}</Tag>
              ))}
              {profileTerms.length === 0 && (
                <Link href="/onboarding" className="text-sm font-semibold text-accent hover:underline">
                  Complete onboarding to improve recommendations →
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Rocket size={18} className="text-accent" />
          <h2 className="text-xl font-semibold">Projects to follow</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {projectMatches.map(({ project, match }) => {
            const readiness = getProjectScore(project);
            return (
              <article key={project.id} className="glass rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/p/${project.slug}`} className="min-w-0">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-muted text-lg font-bold text-accent">
                      {project.name[0]?.toUpperCase()}
                    </span>
                    <h3 className="mt-3 truncate font-semibold hover:text-accent">{project.name}</h3>
                  </Link>
                  <StatusBadge status={project.status} />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{project.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.tags.slice(0, 4).map((tag) => <Tag key={tag}>{tag}</Tag>)}
                </div>
                <div className="mt-4 rounded-lg border border-border bg-surface p-3 font-mono text-[10px] uppercase tracking-wider text-faint">
                  <div className="flex justify-between"><span>Match</span><span className="text-accent">{match.score}%</span></div>
                  <div className="mt-2 flex justify-between"><span>Readiness</span><span>{readiness.score}</span></div>
                  <div className="mt-2 flex justify-between"><span>Why</span><span className="truncate pl-2 text-right normal-case tracking-normal">{match.reason}</span></div>
                </div>
                <div className="mt-4">
                  <FollowProjectButton projectId={project.id} following={project.followedBy.length > 0} path="/matches" />
                </div>
              </article>
            );
          })}
          {projectMatches.length === 0 && <EmptyCard text="Create interests in onboarding to unlock project matches." />}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Users size={18} className="text-accent" />
            <h2 className="text-xl font-semibold">Builders to meet</h2>
          </div>
          <div className="flex flex-col gap-3">
            {peopleMatches.map(({ user, match }) => (
              <article key={user.id} className="glass flex items-center justify-between gap-3 rounded-xl p-4">
                <Link href={`/u/${user.username}`} className="flex min-w-0 items-center gap-3">
                  <Avatar name={user.name} image={user.avatar} size={42} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold hover:text-accent">{user.name}</span>
                    <span className="block truncate text-sm text-muted">{user.headline ?? `@${user.username}`}</span>
                    <span className="mt-1 block truncate font-mono text-[10px] uppercase tracking-wider text-faint">{match.reason}</span>
                  </span>
                </Link>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden font-mono text-xs text-accent sm:block">{match.score}%</span>
                  <FollowUserButton targetUserId={user.id} following={user.followedBy.length > 0} path="/matches" />
                </div>
              </article>
            ))}
            {peopleMatches.length === 0 && <EmptyCard text="No builder matches yet." />}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center gap-2">
            <BriefcaseBusiness size={18} className="text-accent" />
            <h2 className="text-xl font-semibold">Roles you can help with</h2>
          </div>
          <div className="flex flex-col gap-3">
            {roleMatches.map(({ role, match }) => (
              <Link key={role.id} href={`/p/${role.project.slug}`} className="glass rounded-xl p-4 transition-colors hover:border-border-primary">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-sm font-bold">{role.title}</p>
                  <CompensationBadge compensation={role.compensation} />
                </div>
                <p className="mt-1 text-sm text-muted">{role.project.name} — {role.project.tagline}</p>
                {role.description && <p className="mt-2 line-clamp-2 text-xs text-muted">{role.description}</p>}
                <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-faint">
                  {match.score}% match · {match.reason} · {timeAgo(role.createdAt)}
                </p>
              </Link>
            ))}
            {roleMatches.length === 0 && <EmptyCard text="No role matches yet." />}
          </div>
        </div>
      </section>
    </div>
  );
}

async function getProjectCandidates(userId: string) {
  return prisma.project.findMany({
    where: { members: { none: { userId } } },
    include: {
      followedBy: { where: { followerId: userId }, select: { id: true } },
      _count: { select: { members: true, buildLog: true, roadmap: true, openRoles: { where: { status: "OPEN" } }, followedBy: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 40,
  });
}

async function getPeopleCandidates(userId: string) {
  return prisma.user.findMany({
    where: { id: { not: userId } },
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      headline: true,
      skills: true,
      interests: true,
      roles: true,
      followedBy: { where: { followerId: userId }, select: { id: true } },
      _count: { select: { ownedProjects: true, memberships: true, followedBy: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}

async function getRoleCandidates(userId: string) {
  return prisma.openRole.findMany({
    where: { status: "OPEN", project: { members: { none: { userId } } } },
    include: { project: { select: { name: true, slug: true, tagline: true, tags: true } } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}

function normalizeTerms(values: string[]) {
  return Array.from(new Set(values.map((v) => v.toLowerCase().replaceAll("_", " ").trim()).filter(Boolean)));
}

function overlap(a: string[], b: string[]) {
  const bSet = new Set(b);
  return a.filter((term) => bSet.has(term));
}

function fuzzyHits(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.filter((term) => term.length > 2 && lower.includes(term));
}

function scoreProject(project: ProjectCandidate, terms: string[]) {
  const exact = overlap(project.tags.map((t) => t.toLowerCase()), terms);
  const fuzzy = fuzzyHits(`${project.name} ${project.tagline} ${project.description ?? ""}`, terms);
  const activity = Math.min(20, project._count.buildLog * 4 + project._count.followedBy * 2);
  const hiring = project._count.openRoles > 0 ? 8 : 0;
  const score = Math.min(98, 30 + exact.length * 18 + fuzzy.length * 10 + activity + hiring);
  return {
    score,
    reason: exact[0] ? `shared interest: ${exact[0]}` : fuzzy[0] ? `mentions ${fuzzy[0]}` : hiring ? "open team role" : "recent progress",
  };
}

function scorePerson(user: UserCandidate, terms: string[]) {
  const exact = overlap(normalizeTerms([...user.skills, ...user.interests, ...user.roles]), terms);
  const fuzzy = fuzzyHits(user.headline ?? "", terms);
  const network = Math.min(16, user._count.ownedProjects * 5 + user._count.memberships * 3 + user._count.followedBy);
  const score = Math.min(96, 28 + exact.length * 16 + fuzzy.length * 8 + network);
  return {
    score,
    reason: exact[0] ? `shared signal: ${exact[0]}` : fuzzy[0] ? `profile mentions ${fuzzy[0]}` : "active builder",
  };
}

function scoreRole(role: RoleCandidate, terms: string[], openForWork: boolean) {
  const exact = overlap(role.project.tags.map((t) => t.toLowerCase()), terms);
  const fuzzy = fuzzyHits(`${role.title} ${role.description ?? ""} ${role.project.tagline}`, terms);
  const score = Math.min(97, 30 + exact.length * 14 + fuzzy.length * 15 + (openForWork ? 10 : 0));
  return {
    score,
    reason: exact[0] ? `project tag: ${exact[0]}` : fuzzy[0] ? `role mentions ${fuzzy[0]}` : "team is hiring",
  };
}

function EmptyCard({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-faint">{text}</p>;
}
