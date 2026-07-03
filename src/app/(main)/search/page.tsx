import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, MapPin } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, Tag, CompensationBadge } from "@/components/ui/badges";
import { FollowUserButton } from "@/components/social/action-buttons";
import { PostCard } from "@/components/feed/post-card";
import { roleLabels } from "@/lib/format";

export const metadata = { title: "Search" };

const typeTabs = [
  { key: "all", label: "All" },
  { key: "projects", label: "Projects" },
  { key: "people", label: "People" },
  { key: "roles", label: "Roles" },
  { key: "posts", label: "Posts" },
] as const;

type TypeKey = (typeof typeTabs)[number]["key"];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; t?: string }>;
}) {
  const { q = "", t } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const viewerId = session.user.id;
  const query = q.trim();
  const type: TypeKey = typeTabs.some((tab) => tab.key === t)
    ? (t as TypeKey)
    : "all";
  const want = (key: TypeKey) => type === "all" || type === key;
  // On "All" show a few of each; on a dedicated tab go deeper.
  const take = type === "all" ? 8 : 30;

  const [projects, people, roles, posts] = query
    ? await Promise.all([
        want("projects")
          ? prisma.project.findMany({
              where: {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { tagline: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                  { tags: { has: query.toLowerCase() } },
                ],
              },
              include: {
                _count: {
                  select: {
                    members: true,
                    followedBy: true,
                    openRoles: { where: { status: "OPEN" } },
                  },
                },
              },
              orderBy: { updatedAt: "desc" },
              take,
            })
          : Promise.resolve([]),
        want("people")
          ? prisma.user.findMany({
              where: {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { username: { contains: query, mode: "insensitive" } },
                  { headline: { contains: query, mode: "insensitive" } },
                  { skills: { has: query.toLowerCase() } },
                ],
              },
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                headline: true,
                roles: true,
                openForWork: true,
                followedBy: {
                  where: { followerId: viewerId },
                  select: { id: true },
                },
              },
              take,
            })
          : Promise.resolve([]),
        want("roles")
          ? prisma.openRole.findMany({
              where: {
                status: "OPEN",
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                ],
              },
              include: { project: { select: { name: true, slug: true } } },
              orderBy: { createdAt: "desc" },
              take,
            })
          : Promise.resolve([]),
        want("posts")
          ? prisma.post.findMany({
              where: { body: { contains: query, mode: "insensitive" } },
              include: {
                author: {
                  select: {
                    name: true,
                    username: true,
                    avatar: true,
                    headline: true,
                  },
                },
                project: { select: { name: true, slug: true } },
                likes: { select: { userId: true } },
                comments: {
                  include: {
                    user: { select: { name: true, username: true, avatar: true } },
                  },
                  orderBy: { createdAt: "asc" as const },
                },
              },
              orderBy: { createdAt: "desc" },
              take,
            })
          : Promise.resolve([]),
      ])
    : [[], [], [], []];

  const total = projects.length + people.length + roles.length + posts.length;
  const searchPath = (tabKey: TypeKey) =>
    `/search?q=${encodeURIComponent(query)}${tabKey === "all" ? "" : `&t=${tabKey}`}`;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>

      <form action="/search" className="mt-4">
        {type !== "all" && <input type="hidden" name="t" value={type} />}
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search projects, people, roles, posts…"
          autoFocus
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-faint focus:border-border-primary"
        />
      </form>

      {query && (
        <div className="chip-row mt-4">
          {typeTabs.map((tab) => (
            <Link
              key={tab.key}
              href={searchPath(tab.key)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                type === tab.key
                  ? "bg-primary text-on-primary"
                  : "border border-border bg-glass text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      )}

      {!query && (
        <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted">
            Search across projects, builders, open roles and posts.
          </p>
          <p className="mt-1.5 text-xs text-faint">
            Try a tag like &ldquo;ai&rdquo;, a skill like &ldquo;react&rdquo;, or a
            username. Tip: Ctrl K works from any page.
          </p>
        </div>
      )}

      {query && total === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted">
            Nothing found for &ldquo;{query}&rdquo;
          </p>
          <p className="mt-1.5 text-xs text-faint">
            Try a shorter query or a different spelling.
          </p>
        </div>
      )}

      {query && total > 0 && (
        <div className="mt-6 flex flex-col gap-8">
          {projects.length > 0 && (
            <section>
              <SectionHeading>Projects ({projects.length})</SectionHeading>
              <div className="flex flex-col gap-2">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/p/${p.slug}`}
                    className="glass rounded-lg p-4 transition-colors hover:border-border-primary"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">
                        {p.name}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">
                      {p.tagline}
                    </p>
                    {p.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.tags.slice(0, 4).map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </div>
                    )}
                    <p className="mt-2.5 font-mono text-[11px] uppercase tracking-wider text-faint">
                      {p._count.members} team · {p._count.followedBy} followers
                      {p._count.openRoles > 0 && (
                        <span className="text-success">
                          {" "}
                          · {p._count.openRoles} open roles
                        </span>
                      )}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {people.length > 0 && (
            <section>
              <SectionHeading>People ({people.length})</SectionHeading>
              <div className="flex flex-col gap-2">
                {people.map((u) => (
                  <div
                    key={u.id}
                    className="glass flex items-center gap-3 rounded-lg p-3.5"
                  >
                    <Link
                      href={`/u/${u.username}`}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <Avatar name={u.name} image={u.avatar} size={36} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {u.name}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {u.headline ?? `@${u.username}`}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-wider text-faint">
                          {u.roles.map((r) => roleLabels[r] ?? r).join(" · ") ||
                            "Builder"}
                          {u.openForWork && (
                            <span className="text-success"> · open for work</span>
                          )}
                        </span>
                      </span>
                    </Link>
                    {u.id !== viewerId && (
                      <FollowUserButton
                        targetUserId={u.id}
                        following={u.followedBy.length > 0}
                        path={searchPath(type)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {roles.length > 0 && (
            <section>
              <SectionHeading>Open roles ({roles.length})</SectionHeading>
              <div className="flex flex-col gap-2">
                {roles.map((r) => (
                  <Link
                    key={r.id}
                    href={`/p/${r.project.slug}`}
                    className="glass rounded-lg p-3.5 transition-colors hover:border-border-primary"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-sm font-bold">
                        {r.title}
                      </span>
                      <CompensationBadge compensation={r.compensation} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      at {r.project.name}
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-faint">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {r.remote ? "Remote" : "On-site"}
                      </span>
                      {r.hoursPerWeek && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {r.hoursPerWeek}h / week
                        </span>
                      )}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {posts.length > 0 && (
            <section>
              <SectionHeading>Posts ({posts.length})</SectionHeading>
              <div className="flex flex-col gap-3">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={viewerId}
                    path={searchPath(type)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
      {children}
    </h2>
  );
}
