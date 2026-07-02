import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badges";

export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const query = q.trim();

  const [projects, people, roles] = query
    ? await Promise.all([
        prisma.project.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { tagline: { contains: query, mode: "insensitive" } },
              { tags: { has: query.toLowerCase() } },
            ],
          },
          take: 10,
        }),
        prisma.user.findMany({
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
          },
          take: 10,
        }),
        prisma.openRole.findMany({
          where: {
            status: "OPEN",
            title: { contains: query, mode: "insensitive" },
          },
          include: { project: { select: { name: true, slug: true } } },
          take: 10,
        }),
      ])
    : [[], [], []];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>

      <form action="/search" className="mt-4">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search projects, people, roles…"
          autoFocus
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none placeholder:text-faint focus:border-border-primary"
        />
      </form>

      {query && (
        <div className="mt-6 flex flex-col gap-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
              Projects ({projects.length})
            </h2>
            <div className="flex flex-col gap-2">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/p/${p.slug}`}
                  className="glass flex items-center justify-between gap-2 rounded-lg p-3.5 transition-colors hover:border-border-primary"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{p.name}</span>
                    <span className="block truncate text-xs text-muted">{p.tagline}</span>
                  </span>
                  <StatusBadge status={p.status} />
                </Link>
              ))}
              {projects.length === 0 && <Empty />}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
              People ({people.length})
            </h2>
            <div className="flex flex-col gap-2">
              {people.map((u) => (
                <Link
                  key={u.id}
                  href={`/u/${u.username}`}
                  className="glass flex items-center gap-3 rounded-lg p-3.5 transition-colors hover:border-border-primary"
                >
                  <Avatar name={u.name} image={u.avatar} size={36} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{u.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {u.headline ?? `@${u.username}`}
                    </span>
                  </span>
                </Link>
              ))}
              {people.length === 0 && <Empty />}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
              Open roles ({roles.length})
            </h2>
            <div className="flex flex-col gap-2">
              {roles.map((r) => (
                <Link
                  key={r.id}
                  href={`/p/${r.project.slug}`}
                  className="glass rounded-lg p-3.5 transition-colors hover:border-border-primary"
                >
                  <span className="block font-mono text-sm font-bold">{r.title}</span>
                  <span className="block text-xs text-muted">at {r.project.name}</span>
                </Link>
              ))}
              {roles.length === 0 && <Empty />}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-faint">Nothing found</p>;
}
