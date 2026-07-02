import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Globe, Code2, MapPin } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badges";
import { FollowUserButton } from "@/components/social/action-buttons";
import { roleLabels } from "@/lib/format";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const viewerId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      memberships: {
        include: {
          project: {
            include: {
              _count: { select: { followedBy: true, buildLog: true } },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      },
      followedBy: { where: { followerId: viewerId }, select: { id: true } },
      _count: {
        select: {
          followedBy: true,
          follows: true,
          buildLogEntries: true,
        },
      },
    },
  });
  if (!user) notFound();

  const isSelf = user.id === viewerId;
  const projects = user.memberships.map((m) => m.project);
  const launched = projects.filter(
    (p) => p.status === "LAUNCHED" || p.status === "MVP_LAUNCHED",
  ).length;
  const building = projects.filter((p) => p.status === "BUILDING");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      {/* Header */}
      <section className="glass rounded-xl p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} image={user.avatar} size={72} />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
              <p className="text-sm text-muted">@{user.username}</p>
              {user.headline && <p className="mt-1 text-sm">{user.headline}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {user.roles.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-primary-muted px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-accent"
                  >
                    {roleLabels[r] ?? r}
                  </span>
                ))}
                {user.openForWork && (
                  <span className="rounded-full bg-success-muted px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-success">
                    Open for work
                  </span>
                )}
              </div>
            </div>
          </div>
          {!isSelf && (
            <FollowUserButton
              targetUserId={user.id}
              following={user.followedBy.length > 0}
              path={`/u/${user.username}`}
            />
          )}
        </div>

        {user.bio && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">{user.bio}</p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4 font-mono text-[11px] uppercase tracking-wider text-faint">
          {user.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={13} /> {user.location}
            </span>
          )}
          {user.websiteUrl && (
            <a
              href={user.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-muted hover:text-accent"
            >
              <Globe size={13} /> Website
            </a>
          )}
          {user.githubUrl && (
            <a
              href={user.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-muted hover:text-accent"
            >
              <Code2 size={13} /> GitHub
            </a>
          )}
        </div>
      </section>

      {/* Auto-portfolio stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Projects" value={projects.length} />
        <Stat label="Launched" value={launched} />
        <Stat label="Updates" value={user._count.buildLogEntries} />
        <Stat label="Followers" value={user._count.followedBy} />
        <Stat label="Following" value={user._count.follows} />
        <Stat label="Skills" value={user.skills.length} />
      </section>

      {building.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">🔥 Currently building</h2>
          <div className="flex flex-wrap gap-2">
            {building.map((p) => (
              <Link
                key={p.id}
                href={`/p/${p.slug}`}
                className="rounded-full border border-border bg-glass px-3.5 py-1.5 text-sm transition-colors hover:border-border-primary"
              >
                {p.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Projects grid */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Projects</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/p/${p.slug}`}
              className="glass rounded-lg p-4 transition-colors hover:border-border-primary"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{p.name}</p>
                <StatusBadge status={p.status} />
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{p.tagline}</p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-faint">
                {p._count.buildLog} updates · {p._count.followedBy} followers
              </p>
            </Link>
          ))}
          {projects.length === 0 && (
            <p className="col-span-full rounded-lg border border-dashed border-border p-6 text-center text-sm text-faint">
              No projects yet
            </p>
          )}
        </div>
      </section>

      {user.skills.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {user.skills.map((s) => (
              <span
                key={s}
                className="rounded-full bg-glass px-3 py-1 text-xs text-muted"
              >
                {s}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-lg p-3.5 text-center">
      <p className="text-xl font-semibold">{value}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-faint">
        {label}
      </p>
    </div>
  );
}
