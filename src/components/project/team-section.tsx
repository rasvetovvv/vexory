import Link from "next/link";
import { MessageSquare, UserX, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { leaveProject, removeProjectMember } from "@/lib/actions/projects";

type Member = {
  id: string;
  userId: string;
  title: string;
  role: string;
  user: { name: string; username: string; avatar: string | null };
};

export function TeamSection({
  projectId,
  projectSlug,
  members,
  currentUserId,
  viewerRole,
}: {
  projectId: string;
  projectSlug: string;
  members: Member[];
  currentUserId: string;
  viewerRole: string | null;
}) {
  const isMember = viewerRole !== null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Core Team</h2>
        {isMember && (
          <Link
            href={`/p/${projectSlug}/chat`}
            className="flex items-center gap-1.5 rounded-md border border-border bg-glass px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-accent"
          >
            <MessageSquare size={13} />
            Team chat
          </Link>
        )}
      </div>
      <ul className="flex flex-col gap-3">
        {members.map((member) => {
          const canKick =
            member.userId !== currentUserId &&
            member.role !== "OWNER" &&
            (viewerRole === "OWNER" ||
              (viewerRole === "ADMIN" && member.role === "MEMBER"));
          return (
            <li key={member.id} className="flex items-center gap-1">
              <Link
                href={`/u/${member.user.username}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-glass"
              >
                <Avatar
                  name={member.user.name}
                  image={member.user.avatar}
                  size={36}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {member.user.name}
                    {member.role !== "MEMBER" && (
                      <span className="ml-2 rounded-full bg-primary-muted px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-accent">
                        {member.role}
                      </span>
                    )}
                  </span>
                  <span className="block truncate font-mono text-[11px] uppercase tracking-wider text-faint">
                    {member.title}
                  </span>
                </span>
              </Link>
              {canKick && (
                <form action={removeProjectMember}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="memberUserId" value={member.userId} />
                  <button
                    type="submit"
                    title={`Remove ${member.user.name} from the project`}
                    className="rounded-md p-1.5 text-faint transition-colors hover:bg-danger-muted hover:text-danger"
                  >
                    <UserX size={14} />
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>

      {isMember && viewerRole !== "OWNER" && (
        <form action={leaveProject}>
          <input type="hidden" name="projectId" value={projectId} />
          <button
            type="submit"
            className="flex items-center gap-1.5 text-xs text-faint transition-colors hover:text-danger"
          >
            <LogOut size={12} />
            Leave project
          </button>
        </form>
      )}
    </section>
  );
}
