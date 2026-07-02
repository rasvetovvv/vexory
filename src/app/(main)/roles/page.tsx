import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CompensationBadge } from "@/components/ui/badges";
import { compensationLabels, timeAgo } from "@/lib/format";
import { Prisma } from "@/generated/prisma/client";
import { RoleCompensation } from "@/generated/prisma/enums";

export const metadata = { title: "Open Roles" };

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ comp?: string }>;
}) {
  const { comp } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const where: Prisma.OpenRoleWhereInput = { status: "OPEN" };
  if (comp && comp in RoleCompensation) {
    where.compensation = comp as keyof typeof RoleCompensation;
  }

  const roles = await prisma.openRole.findMany({
    where,
    include: {
      project: { select: { name: true, slug: true, tagline: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Open Roles</h1>
      <p className="mt-1 text-sm text-muted">
        Join a team that&apos;s already shipping — equity, paid or contract.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip href="/roles" active={!comp}>
          All
        </FilterChip>
        {Object.entries(compensationLabels).map(([value, label]) => (
          <FilterChip key={value} href={`/roles?comp=${value}`} active={comp === value}>
            {label}
          </FilterChip>
        ))}
      </div>

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
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-on-primary"
          : "border border-border bg-glass text-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
