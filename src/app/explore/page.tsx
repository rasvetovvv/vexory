import Link from "next/link";
import { Rocket, Users, BriefcaseBusiness, Activity } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { StatusBadge, Tag, CompensationBadge } from "@/components/ui/badges";
import { getProjectScore } from "@/lib/project-score";
import { timeAgo } from "@/lib/format";

export const metadata = {
  title: "Explore projects",
  description: "Discover builders, launches, open roles and live project progress on Vexory.",
  alternates: { canonical: "/explore" },
  openGraph: {
    title: "Explore projects on Vexory",
    description: "Discover builders, launches, open roles and live project progress on Vexory.",
    url: "/explore",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore projects on Vexory",
    description: "Discover builders, launches, open roles and live project progress on Vexory.",
  },
};

export default async function ExplorePage() {
  const session = await auth();
  const [projects, launches, roles, stats] = await Promise.all([
    prisma.project.findMany({
      include: {
        _count: { select: { members: true, buildLog: true, roadmap: true, openRoles: true, followedBy: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 9,
    }),
    prisma.feedEvent.findMany({
      where: { type: { in: ["MVP_LAUNCHED", "PROJECT_CREATED", "FUNDING_RAISED"] } },
      include: {
        actor: { select: { name: true, username: true } },
        project: { select: { name: true, slug: true, tagline: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.openRole.findMany({
      where: { status: "OPEN" },
      include: { project: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    Promise.all([
      prisma.project.count(),
      prisma.user.count(),
      prisma.openRole.count({ where: { status: "OPEN" } }),
      prisma.feedEvent.count(),
    ]),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-lg font-bold text-on-primary">V</span>
          <span className="text-lg font-semibold tracking-tight">Vexory</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href={session?.user ? "/feed" : "/auth"} className="rounded-md border border-border bg-glass px-4 py-2 text-sm font-semibold hover:bg-glass-hover">
            {session?.user ? "Open app" : "Sign in"}
          </Link>
          <Link href="/auth" className="rounded-md btn-liquid px-4 py-2 text-sm font-semibold text-on-primary">
            Start building
          </Link>
        </div>
      </header>

      <section className="py-14 md:py-20">
        <p className="rounded-full border border-border bg-glass px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-accent w-fit">
          Live project graph
        </p>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Discover what builders are shipping <span className="text-accent">right now</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
              Browse launches, open roles and progress signals before joining. Vexory turns every project into a living public profile.
            </p>
          </div>
          <div className="glass-deep rounded-2xl p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Network pulse</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="Projects" value={stats[0]} icon={<Rocket size={16} />} />
              <Metric label="Builders" value={stats[1]} icon={<Users size={16} />} />
              <Metric label="Open roles" value={stats[2]} icon={<BriefcaseBusiness size={16} />} />
              <Metric label="Updates" value={stats[3]} icon={<Activity size={16} />} />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Featured projects</h2>
            <p className="mt-1 text-sm text-muted">Sorted by recent progress and enriched with launch readiness.</p>
          </div>
          <Link href="/auth" className="hidden text-sm font-semibold text-accent hover:underline sm:block">Create yours →</Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const score = getProjectScore(project);
            return (
              <Link key={project.id} href={`/showcase/${project.slug}`} className="glass group rounded-xl p-5 transition-colors hover:border-border-primary">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-muted text-lg font-bold text-accent">{project.name[0]?.toUpperCase()}</span>
                  <StatusBadge status={project.status} />
                </div>
                <h3 className="mt-4 text-lg font-semibold group-hover:text-accent">{project.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{project.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.tags.slice(0, 4).map((tag) => <Tag key={tag}>{tag}</Tag>)}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4 font-mono text-[11px] uppercase tracking-wider text-faint">
                  <span>{project._count.members} team · {project._count.buildLog} updates</span>
                  <span className="text-accent">{score.score} score</span>
                </div>
              </Link>
            );
          })}
          {projects.length === 0 && <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-faint md:col-span-2 lg:col-span-3">No public projects yet.</p>}
        </div>
      </section>

      <section className="grid gap-5 py-14 lg:grid-cols-2">
        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-semibold">Recent launches</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {launches.map((event) => (
              <li key={event.id} className="rounded-lg border border-border bg-surface p-3">
                <Link href={`/showcase/${event.project.slug}`} className="font-semibold hover:text-accent">{event.project.name}</Link>
                <p className="mt-1 text-sm text-muted">{event.project.tagline}</p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-faint">{event.actor.name} · {timeAgo(event.createdAt)}</p>
              </li>
            ))}
            {launches.length === 0 && <li className="text-sm text-faint">Launches will appear here.</li>}
          </ul>
        </div>

        <div className="glass rounded-xl p-5">
          <h2 className="text-lg font-semibold">Teams hiring</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {roles.map((role) => (
              <li key={role.id} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/showcase/${role.project.slug}`} className="font-semibold hover:text-accent">{role.title}</Link>
                  <CompensationBadge compensation={role.compensation} />
                </div>
                <p className="mt-1 text-sm text-muted">{role.project.name}{role.hoursPerWeek ? ` · ~${role.hoursPerWeek}h/week` : ""}</p>
              </li>
            ))}
            {roles.length === 0 && <li className="text-sm text-faint">Open roles will appear here.</li>}
          </ul>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-accent">{icon}<span className="font-mono text-2xl font-bold">{value}</span></div>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-faint">{label}</p>
    </div>
  );
}
