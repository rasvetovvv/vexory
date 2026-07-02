import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Globe, Code2, Users } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, Tag } from "@/components/ui/badges";
import {
  BookmarkButton,
  FollowProjectButton,
} from "@/components/social/action-buttons";
import { ApplicationsSection } from "@/components/project/applications-section";
import { BuildLogForm } from "@/components/project/build-log-form";
import { BuildLogList } from "@/components/project/build-log-list";
import { RoadmapSection } from "@/components/project/roadmap-section";
import { RolesSection } from "@/components/project/roles-section";
import { StatusSelect } from "@/components/project/status-select";
import { timeAgo } from "@/lib/format";

export default async function ProjectPage({
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
    include: {
      members: {
        include: { user: { select: { name: true, username: true, avatar: true } } },
        orderBy: { joinedAt: "asc" },
      },
      roadmap: { orderBy: { order: "asc" } },
      openRoles: {
        where: { status: "OPEN" },
        include: { applications: { select: { userId: true } } },
        orderBy: { createdAt: "desc" },
      },
      buildLog: {
        include: {
          author: { select: { name: true, username: true, avatar: true } },
          likes: { select: { userId: true } },
          comments: {
            include: {
              user: { select: { name: true, username: true, avatar: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      followedBy: { where: { followerId: userId }, select: { id: true } },
      bookmarks: { where: { userId }, select: { id: true } },
      _count: { select: { followedBy: true } },
    },
  });
  if (!project) notFound();

  const isMember = project.members.some((m) => m.userId === userId);
  const pendingApplications = isMember
    ? await prisma.roleApplication.findMany({
        where: { status: "PENDING", role: { projectId: project.id } },
        include: {
          user: {
            select: { name: true, username: true, avatar: true, headline: true },
          },
          role: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const path = `/p/${project.slug}`;
  const lastUpdate = project.buildLog[0]?.createdAt;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      {/* Hero */}
      <section className="glass-deep rounded-xl p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-muted text-2xl font-bold text-accent">
              {project.name[0]?.toUpperCase()}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {project.name}
                </h1>
                <StatusBadge status={project.status} />
              </div>
              <p className="mt-1 text-sm text-muted">{project.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isMember ? (
              <StatusSelect projectId={project.id} status={project.status} />
            ) : (
              <FollowProjectButton
                projectId={project.id}
                following={project.followedBy.length > 0}
                path={path}
              />
            )}
            <BookmarkButton
              projectId={project.id}
              bookmarked={project.bookmarks.length > 0}
              path={path}
            />
          </div>
        </div>

        {project.description && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            {project.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {project.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4 font-mono text-[11px] uppercase tracking-wider text-faint">
          <span className="flex items-center gap-1.5">
            <Users size={13} /> {project.members.length} members
          </span>
          <span>{project._count.followedBy} followers</span>
          {lastUpdate && <span>updated {timeAgo(lastUpdate)}</span>}
          {project.websiteUrl && (
            <a
              href={project.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-muted hover:text-accent"
            >
              <Globe size={13} /> Website
            </a>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-muted hover:text-accent"
            >
              <Code2 size={13} /> GitHub
            </a>
          )}
        </div>
      </section>

      <RoadmapSection
        projectId={project.id}
        items={project.roadmap}
        isMember={isMember}
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        {/* Build log */}
        <section className="flex min-w-0 flex-col gap-4">
          <h2 className="text-lg font-semibold">Build Log</h2>
          {isMember && <BuildLogForm projectId={project.id} />}
          <BuildLogList
            entries={project.buildLog}
            currentUserId={userId}
            path={path}
          />
        </section>

        <div className="flex flex-col gap-10">
          {/* Team */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Core Team</h2>
            <ul className="flex flex-col gap-3">
              {project.members.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/u/${m.user.username}`}
                    className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-glass"
                  >
                    <Avatar name={m.user.name} image={m.user.avatar} size={36} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {m.user.name}
                      </span>
                      <span className="block truncate font-mono text-[11px] uppercase tracking-wider text-faint">
                        {m.title}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <RolesSection
            projectId={project.id}
            roles={project.openRoles}
            isMember={isMember}
            currentUserId={userId}
          />

          {isMember && <ApplicationsSection applications={pendingApplications} />}
        </div>
      </div>
    </div>
  );
}
