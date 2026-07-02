import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { FollowUserButton } from "@/components/social/action-buttons";
import { FeedCard } from "@/components/feed/feed-card";
import { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Feed" };

const tabs = [
  { key: "all", label: "All" },
  { key: "following", label: "Following" },
  { key: "launches", label: "Launches" },
  { key: "roles", label: "Roles" },
] as const;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "all" } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const userId = session.user.id;

  let where: Prisma.FeedEventWhereInput = {};
  if (tab === "following") {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followedUserId: true, followedProjectId: true },
    });
    const followedUsers = follows
      .map((f) => f.followedUserId)
      .filter((id): id is string => !!id);
    const followedProjects = follows
      .map((f) => f.followedProjectId)
      .filter((id): id is string => !!id);
    where = {
      OR: [
        { actorId: { in: followedUsers } },
        { projectId: { in: followedProjects } },
      ],
    };
  } else if (tab === "launches") {
    where = { type: { in: ["MVP_LAUNCHED", "PROJECT_CREATED", "FUNDING_RAISED"] } };
  } else if (tab === "roles") {
    where = { type: "ROLE_OPENED" };
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [events, trendingRaw, whoToFollow] = await Promise.all([
    prisma.feedEvent.findMany({
      where,
      include: {
        actor: { select: { name: true, username: true, avatar: true } },
        project: { select: { name: true, slug: true, tagline: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.feedEvent.groupBy({
      by: ["projectId"],
      where: { createdAt: { gte: weekAgo } },
      _count: { projectId: true },
      orderBy: { _count: { projectId: "desc" } },
      take: 5,
    }),
    prisma.user.findMany({
      where: {
        id: { not: userId },
        followedBy: { none: { followerId: userId } },
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        headline: true,
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const trendingProjects = await prisma.project.findMany({
    where: { id: { in: trendingRaw.map((t) => t.projectId) } },
    select: { id: true, name: true, slug: true, tagline: true },
  });
  const trending = trendingRaw
    .map((t) => ({
      project: trendingProjects.find((p) => p.id === t.projectId),
      count: t._count.projectId,
    }))
    .filter((t) => t.project);

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">Feed</h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.key === "all" ? "/feed" : `/feed?tab=${t.key}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-primary text-on-primary"
                  : "border border-border bg-glass text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {events.map((event) => (
            <FeedCard key={event.id} event={event} />
          ))}
          {events.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-faint">
              {tab === "following"
                ? "Follow builders and projects to see their progress here"
                : "Nothing here yet — create a project and post your first update"}
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <aside className="hidden flex-col gap-6 xl:flex">
        <section className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold">Trending projects</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {trending.map(({ project, count }) => (
              <li key={project!.id}>
                <Link
                  href={`/p/${project!.slug}`}
                  className="flex items-center justify-between gap-2 rounded-md p-1 transition-colors hover:bg-glass"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {project!.name}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {project!.tagline}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-accent">
                    🔥 {count}
                  </span>
                </Link>
              </li>
            ))}
            {trending.length === 0 && (
              <li className="text-xs text-faint">No activity this week</li>
            )}
          </ul>
        </section>

        <section className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold">Who to follow</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {whoToFollow.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2">
                <Link
                  href={`/u/${u.username}`}
                  className="flex min-w-0 items-center gap-2.5"
                >
                  <Avatar name={u.name} image={u.avatar} size={32} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{u.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {u.headline ?? `@${u.username}`}
                    </span>
                  </span>
                </Link>
                <FollowUserButton targetUserId={u.id} following={false} path="/feed" />
              </li>
            ))}
            {whoToFollow.length === 0 && (
              <li className="text-xs text-faint">You follow everyone already</li>
            )}
          </ul>
        </section>
      </aside>
    </div>
  );
}
