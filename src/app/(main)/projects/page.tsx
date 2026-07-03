import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { StatusBadge, Tag } from "@/components/ui/badges";
import { MomentumBadges } from "@/components/project/momentum-badges";
import { computeMomentum } from "@/lib/momentum";
import { openToLabels, statusLabels } from "@/lib/format";
import { Prisma } from "@/generated/prisma/client";
import { ProjectStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Projects" };

// Outside the component: Date.now() trips the react-hooks/purity lint rule.
function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 3600 * 1000);
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; hiring?: string }>;
}) {
  const { status, hiring } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const where: Prisma.ProjectWhereInput = {};
  if (status && status in ProjectStatus) {
    where.status = status as keyof typeof ProjectStatus;
  }
  if (hiring === "1") {
    where.openRoles = { some: { status: "OPEN" } };
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      _count: {
        select: {
          followedBy: true,
          buildLog: true,
          members: true,
          openRoles: { where: { status: "OPEN" } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 60,
  });

  // One aggregate powers all momentum badges: updates per project, 14 days.
  const recentUpdates = await prisma.buildLogEntry.groupBy({
    by: ["projectId"],
    where: {
      projectId: { in: projects.map((p) => p.id) },
      createdAt: { gte: daysAgo(14) },
    },
    _count: { projectId: true },
  });
  const updatesById = new Map(
    recentUpdates.map((r) => [r.projectId, r._count.projectId]),
  );

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>

      <div className="chip-row mt-4">
        <FilterChip href="/projects" active={!status && hiring !== "1"}>
          All
        </FilterChip>
        {Object.entries(statusLabels).map(([value, label]) => (
          <FilterChip
            key={value}
            href={`/projects?status=${value}`}
            active={status === value}
          >
            {label}
          </FilterChip>
        ))}
        <FilterChip href="/projects?hiring=1" active={hiring === "1"}>
          Hiring
        </FilterChip>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {projects.map((p) => {
          const momentum = computeMomentum({
            membersCount: p._count.members,
            openRolesCount: p._count.openRoles,
            updatesLast14d: updatesById.get(p.id) ?? 0,
          });
          return (
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
              {(momentum.length > 0 || p.openTo.length > 0) && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <MomentumBadges badges={momentum} size="sm" />
                  {p.openTo.slice(0, 2).map((o) => (
                    <span
                      key={o}
                      className="inline-flex rounded-full border border-border bg-glass px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted"
                    >
                      {openToLabels[o] ?? o}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.tags.slice(0, 4).map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-faint">
                {p._count.members} team · {p._count.buildLog} updates ·{" "}
                {p._count.followedBy} followers
                {p._count.openRoles > 0 && (
                  <span className="text-success"> · {p._count.openRoles} open roles</span>
                )}
              </p>
            </Link>
          );
        })}
        {projects.length === 0 && (
          <p className="col-span-full rounded-lg border border-dashed border-border p-10 text-center text-sm text-faint">
            No projects match this filter
          </p>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-on-primary"
          : "border border-border bg-glass text-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
