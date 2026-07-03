import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { FollowUserButton } from "@/components/social/action-buttons";
import { FeedCard } from "@/components/feed/feed-card";
import { PostCard, type PostData } from "@/components/feed/post-card";
import { PostComposer } from "@/components/feed/post-composer";
import { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Feed" };

const tabs = [
  { key: "all", label: "Global" },
  { key: "following", label: "Following" },
  { key: "posts", label: "Posts" },
  { key: "launches", label: "Launches" },
  { key: "hiring", label: "Hiring" },
  { key: "milestones", label: "Milestones" },
  { key: "trending", label: "Trending" },
] as const;

// Outside the component: Date.now() trips the react-hooks/purity lint rule
// when called during render, even in a server component.
function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 3600 * 1000);
}

const postInclude = {
  author: {
    select: { name: true, username: true, avatar: true, headline: true },
  },
  project: { select: { name: true, slug: true } },
  likes: { select: { userId: true } },
  comments: {
    include: {
      user: { select: { name: true, username: true, avatar: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.PostInclude;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; limit?: string }>;
}) {
  const { tab = "all", limit: limitParam } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const userId = session.user.id;
  // "Show more" grows this in increments of 50, capped to keep queries sane.
  const limit = Math.min(Math.max(Number(limitParam) || 50, 50), 200);

  let where: Prisma.FeedEventWhereInput = {};
  let followedUsers: string[] = [];
  if (tab === "following") {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followedUserId: true, followedProjectId: true },
    });
    followedUsers = follows
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
  } else if (tab === "hiring") {
    where = { type: "ROLE_OPENED" };
  } else if (tab === "milestones") {
    where = { type: { in: ["BUILD_LOG_POSTED", "STATUS_CHANGED", "FUNDING_RAISED"] } };
  }

  const weekAgo = daysAgo(7);
  // Events-per-project over the last week: powers the sidebar widget and,
  // for the "Trending" tab, restricts the feed to the most active projects.
  const trendingRaw = await prisma.feedEvent.groupBy({
    by: ["projectId"],
    where: { createdAt: { gte: weekAgo } },
    _count: { projectId: true },
    orderBy: { _count: { projectId: "desc" } },
    take: 12,
  });
  if (tab === "trending") {
    where = {
      projectId: { in: trendingRaw.map((t) => t.projectId) },
      createdAt: { gte: weekAgo },
    };
  }

  // User posts join the timeline on the Global and Following tabs;
  // the Posts tab shows them exclusively.
  const showPosts = tab === "all" || tab === "following" || tab === "posts";

  const [events, posts, viewer, whoToFollow] = await Promise.all([
    tab === "posts"
      ? Promise.resolve(
          [] as Prisma.FeedEventGetPayload<{
            include: {
              actor: { select: { name: true; username: true; avatar: true } };
              project: { select: { name: true; slug: true; tagline: true } };
            };
          }>[],
        )
      : prisma.feedEvent.findMany({
          where,
          include: {
            actor: { select: { name: true, username: true, avatar: true } },
            project: { select: { name: true, slug: true, tagline: true } },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
    showPosts
      ? prisma.post.findMany({
          where:
            tab === "following"
              ? { authorId: { in: followedUsers } }
              : undefined,
          include: postInclude,
          orderBy: { createdAt: "desc" },
          take: limit,
        })
      : Promise.resolve([] as Prisma.PostGetPayload<{ include: typeof postInclude }>[]),
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, avatar: true },
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

  type TimelineItem =
    | { kind: "event"; date: Date; event: (typeof events)[number] }
    | { kind: "post"; date: Date; post: PostData };

  const timeline: TimelineItem[] = [
    ...events.map((event) => ({
      kind: "event" as const,
      date: event.createdAt,
      event,
    })),
    ...posts.map((post) => ({
      kind: "post" as const,
      date: post.createdAt,
      post,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);

  const trendingTop = trendingRaw.slice(0, 5);
  const trendingProjects = await prisma.project.findMany({
    where: { id: { in: trendingTop.map((t) => t.projectId) } },
    select: { id: true, name: true, slug: true, tagline: true },
  });
  const trending = trendingTop
    .map((t) => ({
      project: trendingProjects.find((p) => p.id === t.projectId),
      count: t._count.projectId,
    }))
    .filter((t) => t.project);

  const feedPath = tab === "all" ? "/feed" : `/feed?tab=${tab}`;

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">Feed</h1>

        <div className="chip-row mt-4">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.key === "all" ? "/feed" : `/feed?tab=${t.key}`}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-primary text-on-primary"
                  : "border border-border bg-glass text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Compact trending strip where the right sidebar is hidden */}
        {trending.length > 0 && (
          <div className="chip-row mt-4 xl:hidden">
            <span className="flex shrink-0 items-center font-mono text-[10px] font-bold uppercase tracking-wider text-faint">
              Trending
            </span>
            {trending.map(({ project, count }) => (
              <Link
                key={project!.id}
                href={`/p/${project!.slug}`}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-glass px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
              >
                {project!.name}
                <span className="font-mono text-[10px] text-accent">
                  {count}
                </span>
              </Link>
            ))}
          </div>
        )}

        {showPosts && (
          <div className="mt-5">
            <PostComposer user={{ name: viewer.name, image: viewer.avatar }} />
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3">
          {timeline.map((item) =>
            item.kind === "post" ? (
              <PostCard
                key={`post-${item.post.id}`}
                post={item.post}
                currentUserId={userId}
                path={feedPath}
              />
            ) : (
              <FeedCard key={`event-${item.event.id}`} event={item.event} />
            ),
          )}
          {timeline.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-faint">
              {tab === "following"
                ? "Follow builders and projects to see their progress here"
                : "Nothing here yet — create a project and post your first update"}
            </div>
          )}
          {timeline.length >= limit && (
            <Link
              href={`${feedPath}${feedPath.includes("?") ? "&" : "?"}limit=${limit + 50}`}
              scroll={false}
              className="rounded-lg border border-border bg-glass py-3 text-center text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Show more
            </Link>
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
