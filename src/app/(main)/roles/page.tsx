import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CompensationBadge } from "@/components/ui/badges";
import { withdrawApplication } from "@/lib/actions/projects";
import { compensationLabels, timeAgo } from "@/lib/format";
import { Prisma } from "@/generated/prisma/client";
import { RoleCompensation } from "@/generated/prisma/enums";

export const metadata = { title: "Open Roles" };

const applicationStyles: Record<string, string> = {
  PENDING: "bg-info-muted text-info",
  ACCEPTED: "bg-success-muted text-success",
  REJECTED: "bg-danger-muted text-danger",
  WITHDRAWN: "bg-glass text-muted",
};

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ comp?: string; view?: string }>;
}) {
  const { comp, view } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const userId = session.user.id;
  const showMine = view === "mine";

  const where: Prisma.OpenRoleWhereInput = { status: "OPEN" };
  if (comp && comp in RoleCompensation) {
    where.compensation = comp as keyof typeof RoleCompensation;
  }

  const [roles, myApplications] = await Promise.all([
    showMine
      ? []
      : prisma.openRole.findMany({
          where,
          include: {
            project: { select: { name: true, slug: true, tagline: true } },
            _count: {
              select: {
                applications: { where: { status: { not: "WITHDRAWN" } } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 60,
        }),
    prisma.roleApplication.findMany({
      where: { userId },
      include: {
        role: {
          include: { project: { select: { name: true, slug: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Open Roles</h1>
      <p className="mt-1 text-sm text-muted">
        Join a team that&apos;s already shipping — equity, paid or contract.
      </p>

      <div className="chip-row mt-4">
        <FilterChip href="/roles" active={!comp && !showMine}>
          All
        </FilterChip>
        {Object.entries(compensationLabels).map(([value, label]) => (
          <FilterChip
            key={value}
            href={`/roles?comp=${value}`}
            active={!showMine && comp === value}
          >
            {label}
          </FilterChip>
        ))}
        <FilterChip href="/roles?view=mine" active={showMine}>
          My applications
          {myApplications.length > 0 && ` (${myApplications.length})`}
        </FilterChip>
      </div>

      {showMine ? (
        <ul className="mt-5 flex flex-col gap-3">
          {myApplications.map((application) => (
            <li key={application.id} className="glass rounded-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/p/${application.role.project.slug}`}
                  className="font-mono text-sm font-bold hover:text-accent"
                >
                  {application.role.title}
                </Link>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider ${applicationStyles[application.status] ?? "bg-glass text-muted"}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {application.status.toLowerCase()}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {application.role.project.name}
                {application.role.status !== "OPEN" && " · role closed"}
              </p>
              {application.message && (
                <p className="mt-1.5 line-clamp-2 text-xs text-muted">
                  “{application.message}”
                </p>
              )}
              <div className="mt-2.5 flex items-center justify-between gap-3">
                <p className="font-mono text-[11px] uppercase tracking-wider text-faint">
                  applied {timeAgo(application.createdAt)}
                </p>
                {application.status === "PENDING" && (
                  <form action={withdrawApplication.bind(null, application.id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-danger/40 hover:text-danger"
                    >
                      Withdraw
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
          {myApplications.length === 0 && (
            <li className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-faint">
              You haven&apos;t applied to any roles yet —{" "}
              <Link href="/roles" className="text-accent hover:underline">
                browse open roles
              </Link>
            </li>
          )}
        </ul>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {roles.map((role) => (
            <li key={role.id}>
              <Link
                href={`/p/${role.project.slug}`}
                className="glass block rounded-lg p-4 transition-colors hover:border-border-primary"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-sm font-bold">{role.title}</p>
                  <CompensationBadge compensation={role.compensation} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {role.project.name} — {role.project.tagline}
                </p>
                {role.description && (
                  <p className="mt-1.5 line-clamp-2 text-xs text-muted">{role.description}</p>
                )}
                <p className="mt-2.5 font-mono text-[11px] uppercase tracking-wider text-faint">
                  {role.hoursPerWeek ? `~${role.hoursPerWeek}h/week · ` : ""}
                  {role._count.applications} applicants · {timeAgo(role.createdAt)}
                </p>
              </Link>
            </li>
          ))}
          {roles.length === 0 && (
            <li className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-faint">
              No open roles right now
            </li>
          )}
        </ul>
      )}
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
