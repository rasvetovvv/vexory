import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/ui/badges";

export const metadata = { title: "Bookmarks" };

export default async function BookmarksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    include: {
      project: {
        include: { _count: { select: { followedBy: true, buildLog: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Bookmarks</h1>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {bookmarks.map(({ project }) => (
          <Link
            key={project.id}
            href={`/p/${project.slug}`}
            className="glass rounded-lg p-4 transition-colors hover:border-border-primary"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{project.name}</p>
              <StatusBadge status={project.status} />
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{project.tagline}</p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-faint">
              {project._count.buildLog} updates · {project._count.followedBy} followers
            </p>
          </Link>
        ))}
        {bookmarks.length === 0 && (
          <p className="col-span-full rounded-lg border border-dashed border-border p-10 text-center text-sm text-faint">
            No bookmarks yet — save projects to check on them later
          </p>
        )}
      </div>
    </div>
  );
}
