import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, UserX } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { ChatRoom } from "@/components/project/chat-room";
import { removeProjectMember } from "@/lib/actions/projects";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { name: true },
  });
  return { title: project ? `${project.name} — chat` : "Team chat" };
}

export default async function ProjectChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const userId = session.user.id;

  const project = await prisma.project.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      members: {
        include: {
          user: { select: { name: true, username: true, avatar: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      chatMessages: {
        include: {
          author: { select: { name: true, username: true, avatar: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 200,
      },
    },
  });
  if (!project) notFound();

  // The chat is members-only; losing membership removes access.
  const membership = project.members.find((m) => m.userId === userId);
  if (!membership) redirect(`/p/${project.slug}`);
  const canModerate = ["OWNER", "ADMIN"].includes(membership.role);

  return (
    <div className="mx-auto flex h-[calc(100dvh-11.5rem)] max-w-5xl flex-col gap-4 lg:h-[calc(100dvh-8rem)]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/p/${project.slug}`}
            className="flex w-fit items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft size={13} />
            {project.name}
          </Link>
          <h1 className="mt-1 truncate text-xl font-semibold tracking-tight">
            Team chat
          </h1>
        </div>
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-faint">
          {project.members.length} members
        </span>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_260px]">
        <ChatRoom
          projectId={project.id}
          messages={project.chatMessages}
          currentUserId={userId}
          canModerate={canModerate}
        />

        <aside className="hidden min-h-0 flex-col overflow-y-auto rounded-xl border border-border p-4 lg:flex">
          <h2 className="text-sm font-semibold">Members</h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {project.members.map((member) => {
              const canKick =
                member.userId !== userId &&
                member.role !== "OWNER" &&
                (membership.role === "OWNER" ||
                  (membership.role === "ADMIN" && member.role === "MEMBER"));
              return (
                <li key={member.id} className="flex items-center gap-2.5">
                  <Link
                    href={`/u/${member.user.username}`}
                    className="flex min-w-0 flex-1 items-center gap-2.5"
                  >
                    <Avatar
                      name={member.user.name}
                      image={member.user.avatar}
                      size={30}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {member.user.name}
                      </span>
                      <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-faint">
                        {member.role === "MEMBER" ? member.title : member.role}
                      </span>
                    </span>
                  </Link>
                  {canKick && (
                    <form action={removeProjectMember}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <input
                        type="hidden"
                        name="memberUserId"
                        value={member.userId}
                      />
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
        </aside>
      </div>
    </div>
  );
}
