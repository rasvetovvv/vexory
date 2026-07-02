import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { markAllNotificationsRead } from "@/lib/actions/social";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Notifications" };

const messages: Record<string, string> = {
  NEW_FOLLOWER: "started following you",
  PROJECT_FOLLOWED: "followed your project",
  ROLE_APPLICATION: "applied to a role in your project",
  APPLICATION_ACCEPTED: "accepted your application",
  COMMENT: "commented on your update",
  LIKE: "liked your update",
  MEMBER_INVITED: "invited you to a project",
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const notifications = await prisma.notification.findMany({
    where: { recipientId: session.user.id },
    include: {
      actor: { select: { name: true, username: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const projectIds = [
    ...new Set(notifications.map((n) => n.projectId).filter((id): id is string => !!id)),
  ];
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true, slug: true },
  });
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        {hasUnread && (
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="rounded-md border border-border bg-glass px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground"
            >
              Mark all as read
            </button>
          </form>
        )}
      </div>

      <ul className="mt-5 flex flex-col gap-2">
        {notifications.map((n) => {
          const project = n.projectId ? projectById.get(n.projectId) : null;
          return (
            <li
              key={n.id}
              className={`glass flex items-center gap-3 rounded-lg p-3.5 ${
                n.read ? "opacity-70" : "border-border-primary"
              }`}
            >
              {n.actor ? (
                <Link href={`/u/${n.actor.username}`}>
                  <Avatar name={n.actor.name} image={n.actor.avatar} size={36} />
                </Link>
              ) : (
                <Avatar name="Vexory" size={36} />
              )}
              <div className="min-w-0 flex-1 text-sm">
                {n.actor && (
                  <Link
                    href={`/u/${n.actor.username}`}
                    className="font-semibold hover:text-accent"
                  >
                    {n.actor.name}
                  </Link>
                )}{" "}
                <span className="text-muted">{messages[n.type] ?? n.type}</span>
                {project && (
                  <>
                    {" "}
                    <Link
                      href={`/p/${project.slug}`}
                      className="font-semibold text-accent hover:underline"
                    >
                      {project.name}
                    </Link>
                  </>
                )}
                <span className="ml-2 font-mono text-[11px] uppercase tracking-wider text-faint">
                  {timeAgo(n.createdAt)}
                </span>
              </div>
            </li>
          );
        })}
        {notifications.length === 0 && (
          <li className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-faint">
            No notifications yet
          </li>
        )}
      </ul>
    </div>
  );
}
