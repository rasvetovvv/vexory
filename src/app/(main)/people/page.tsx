import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { FollowUserButton } from "@/components/social/action-buttons";
import { roleLabels } from "@/lib/format";
import { Prisma } from "@/generated/prisma/client";
import { UserRole } from "@/generated/prisma/enums";

export const metadata = { title: "People" };

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; open?: string }>;
}) {
  const { role, open } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const viewerId = session.user.id;

  const where: Prisma.UserWhereInput = {};
  if (role && role in UserRole) {
    where.roles = { has: role as keyof typeof UserRole };
  }
  if (open === "1") where.openForWork = true;

  const people = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      headline: true,
      roles: true,
      openForWork: true,
      followedBy: { where: { followerId: viewerId }, select: { id: true } },
      _count: { select: { memberships: true, followedBy: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight">People</h1>

      <div className="chip-row mt-4">
        <FilterChip href="/people" active={!role && open !== "1"}>
          All
        </FilterChip>
        {Object.entries(roleLabels)
          .filter(([v]) => v !== "OTHER")
          .map(([value, label]) => (
            <FilterChip key={value} href={`/people?role=${value}`} active={role === value}>
              {label}
            </FilterChip>
          ))}
        <FilterChip href="/people?open=1" active={open === "1"}>
          Open for work
        </FilterChip>
      </div>

      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {people.map((u) => (
          <li key={u.id} className="glass flex items-center gap-3 rounded-lg p-4">
            <Link href={`/u/${u.username}`} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar name={u.name} image={u.avatar} size={44} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{u.name}</span>
                <span className="block truncate text-xs text-muted">
                  {u.headline ?? `@${u.username}`}
                </span>
                <span className="mt-1 block truncate font-mono text-[10px] uppercase tracking-wider text-faint">
                  {u.roles.map((r) => roleLabels[r] ?? r).join(" · ") || "Builder"}
                  {u.openForWork && <span className="text-success"> · open for work</span>}
                </span>
              </span>
            </Link>
            {u.id !== viewerId && (
              <FollowUserButton
                targetUserId={u.id}
                following={u.followedBy.length > 0}
                path="/people"
              />
            )}
          </li>
        ))}
        {people.length === 0 && (
          <li className="col-span-full rounded-lg border border-dashed border-border p-10 text-center text-sm text-faint">
            No people match this filter
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
