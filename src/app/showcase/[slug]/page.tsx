import Link from "next/link";
import { notFound } from "next/navigation";
import { Code2, Globe, Rocket, Users } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { StatusBadge, Tag, CompensationBadge } from "@/components/ui/badges";
import { Avatar } from "@/components/ui/avatar";
import { ProjectScoreCard } from "@/components/project/project-score-card";
import { timeAgo } from "@/lib/format";
import { publicBaseUrl } from "@/lib/urls";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug }, select: { name: true, tagline: true, status: true } });
  const launched = project && ["MVP_LAUNCHED", "LAUNCHED"].includes(project.status);
  const title = project
    ? launched
      ? `${project.name} has launched`
      : `${project.name} · Vexory project`
    : "Project · Vexory";
  const description = project?.tagline ?? "Public Vexory project profile.";
  const url = `/showcase/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: "Vexory",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicProjectShowcase({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      members: { include: { user: { select: { name: true, username: true, avatar: true, headline: true } } }, orderBy: { joinedAt: "asc" } },
      roadmap: { orderBy: { order: "asc" } },
      openRoles: { where: { status: "OPEN" }, orderBy: { createdAt: "desc" } },
      buildLog: { include: { author: { select: { name: true, username: true, avatar: true } } }, orderBy: { createdAt: "desc" }, take: 6 },
      _count: { select: { followedBy: true, members: true, buildLog: true, roadmap: true, openRoles: true } },
    },
  });
  if (!project) notFound();

  const isLaunched = ["MVP_LAUNCHED", "LAUNCHED"].includes(project.status);
  const shareUrl = `${publicBaseUrl()}/showcase/${project.slug}`;
  const shareText = `${project.name} has launched — ${project.tagline}`;
  const shares = [
    { label: "Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}` },
    { label: "X", href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
  ];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/explore" className="flex items-center gap-2.5 text-sm font-semibold text-muted hover:text-foreground">← Explore projects</Link>
        <div className="flex items-center gap-3">
          {session?.user ? (
            <Link href={`/p/${project.slug}`} className="rounded-md btn-liquid px-4 py-2 text-sm font-semibold text-on-primary">Open in app</Link>
          ) : (
            <>
              <Link href="/auth" className="rounded-md border border-border bg-glass px-4 py-2 text-sm font-semibold hover:bg-glass-hover">Sign in</Link>
              <Link href="/auth" className="rounded-md btn-liquid px-4 py-2 text-sm font-semibold text-on-primary">Join Vexory</Link>
            </>
          )}
        </div>
      </header>

      <section className="mt-8 glass-deep rounded-2xl p-6 md:p-8">
        {isLaunched && (
          <p className="mb-4 flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-wider text-success">
            <Rocket size={14} />
            {project.name} has launched
          </p>
        )}
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-2xl font-bold text-accent">{project.name[0]?.toUpperCase()}</span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
                <StatusBadge status={project.status} />
              </div>
              <p className="mt-2 max-w-2xl text-muted">{project.tagline}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.websiteUrl && (
              isLaunched ? (
                <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" className="rounded-md btn-liquid px-4 py-2 text-sm font-semibold text-on-primary"><Globe size={15} className="mr-1 inline" /> Visit website</a>
              ) : (
                <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-border bg-glass px-3 py-2 text-sm font-semibold hover:bg-glass-hover"><Globe size={15} className="inline" /> Website</a>
              )
            )}
            {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-border bg-glass px-3 py-2 text-sm font-semibold hover:bg-glass-hover"><Code2 size={15} className="inline" /> GitHub</a>}
            {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-border bg-glass px-3 py-2 text-sm font-semibold hover:bg-glass-hover">Live demo</a>}
          </div>
        </div>

        {isLaunched && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-faint">Spread the word</span>
            {shares.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border bg-glass px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground"
              >
                {s.label}
              </a>
            ))}
          </div>
        )}

        {project.description && <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted">{project.description}</p>}
        <div className="mt-4 flex flex-wrap gap-1.5">{project.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</div>
        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4 font-mono text-[11px] uppercase tracking-wider text-faint">
          <span className="flex items-center gap-1.5"><Users size={13} /> {project._count.members} members</span>
          <span>{project._count.followedBy} followers</span>
          <span>{project._count.buildLog} build updates</span>
          <span>{project._count.openRoles} open roles</span>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section className="flex flex-col gap-6">
          <div className="glass rounded-xl p-5">
            <h2 className="text-lg font-semibold">Latest build log</h2>
            <div className="mt-4 flex flex-col gap-3">
              {project.buildLog.map((entry) => (
                <article key={entry.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{entry.title}</p>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-accent">{entry.type.replace("_", " ")}</span>
                  </div>
                  {entry.body && <p className="mt-2 text-sm leading-relaxed text-muted">{entry.body}</p>}
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-faint">{entry.author.name} · {timeAgo(entry.createdAt)}</p>
                </article>
              ))}
              {project.buildLog.length === 0 && <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-faint">No public build updates yet.</p>}
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <h2 className="text-lg font-semibold">Roadmap</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {project.roadmap.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-surface p-4">
                  <p className="font-semibold">{item.title}</p>
                  {item.description && <p className="mt-1 text-sm text-muted">{item.description}</p>}
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-faint">{item.status.replace("_", " ")}</p>
                </div>
              ))}
              {project.roadmap.length === 0 && <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-faint sm:col-span-2">Roadmap has not been published yet.</p>}
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          <ProjectScoreCard project={project} />

          <section className="glass rounded-xl p-5">
            <h2 className="text-sm font-semibold">Team</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {project.members.map((member) => (
                <li key={member.id} className="flex items-center gap-3">
                  <Avatar name={member.user.name} image={member.user.avatar} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{member.user.name}</p>
                    <p className="truncate font-mono text-[10px] uppercase tracking-wider text-faint">{member.title}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="glass rounded-xl p-5">
            <h2 className="text-sm font-semibold">Open roles</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {project.openRoles.map((role) => (
                <li key={role.id} className="rounded-lg border border-border bg-surface p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{role.title}</p>
                    <CompensationBadge compensation={role.compensation} />
                  </div>
                  {role.description && <p className="mt-1 line-clamp-2 text-xs text-muted">{role.description}</p>}
                </li>
              ))}
              {project.openRoles.length === 0 && <li className="text-sm text-faint">No open roles right now.</li>}
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
