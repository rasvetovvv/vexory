import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Globe, Code2, Users, Pencil } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
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
import { InviteTeammatesSection } from "@/components/project/invite-teammates-section";
import { TeamSection } from "@/components/project/team-section";
import { StatusSelect } from "@/components/project/status-select";
import { ProjectScoreCard } from "@/components/project/project-score-card";
import { ActivityGraph } from "@/components/project/activity-graph";
import { MomentumBadges } from "@/components/project/momentum-badges";
import {
  ProjectTimeline,
  type TimelineEvent,
} from "@/components/project/project-timeline";
import { StatusTrack } from "@/components/project/status-track";
import { VerificationList } from "@/components/project/verification-list";
import { LaunchShareCard } from "@/components/project/launch-share";
import { PostCard } from "@/components/feed/post-card";
import { PostComposer } from "@/components/feed/post-composer";
import { ShareButton } from "@/components/ui/share-button";
import { computeMomentum } from "@/lib/momentum";
import { openToLabels, statusLabels } from "@/lib/format";
import {
  acceptProjectInvite,
  declineProjectInvite,
} from "@/lib/actions/projects";
import { timeAgo } from "@/lib/format";

// Outside the component: Date.now() trips the react-hooks/purity lint rule
// when called during render, even in a server component.
function weeksAgo(weeks: number) {
  return new Date(Date.now() - weeks * 7 * 24 * 3600 * 1000);
}

function FounderNote({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-accent">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">
        {text}
      </p>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { name: true, tagline: true },
  });
  if (!project) return { title: "Project" };
  return { title: project.name, description: project.tagline };
}

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
      invites: {
        where: { status: "PENDING" },
        include: { recipient: { select: { id: true, name: true, username: true } } },
        orderBy: { createdAt: "desc" },
      },
      roadmap: { orderBy: { order: "asc" } },
      openRoles: {
        where: { status: "OPEN" },
        include: {
          applications: {
            where: { status: { not: "WITHDRAWN" } },
            select: { userId: true },
          },
        },
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
  const currentMembership = project.members.find((m) => m.userId === userId);
  const isOwner = currentMembership?.role === "OWNER";
  const isAdmin =
    !!currentMembership && ["OWNER", "ADMIN"].includes(currentMembership.role);
  // Exact dates for the activity graph — the included buildLog is capped at
  // 50 entries, which would understate very active projects.
  const [activityDatesRaw, statusEvents, projectPosts, viewer] =
    await Promise.all([
      prisma.buildLogEntry.findMany({
        where: {
          projectId: project.id,
          createdAt: { gte: weeksAgo(12) },
        },
        select: { createdAt: true },
      }),
      prisma.feedEvent.findMany({
        where: {
          projectId: project.id,
          type: { in: ["STATUS_CHANGED", "MVP_LAUNCHED"] },
        },
        select: { type: true, payload: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.post.findMany({
        where: { projectId: project.id },
        include: {
          author: {
            select: { name: true, username: true, avatar: true, headline: true },
          },
          project: { select: { name: true, slug: true } },
          likes: { select: { userId: true } },
          comments: {
            include: {
              user: { select: { name: true, username: true, avatar: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { name: true, avatar: true },
      }),
    ]);
  const activityDates = activityDatesRaw.map((e) => e.createdAt);

  // The project's journey, assembled from data already at hand.
  const timelineEvents: TimelineEvent[] = [
    { date: project.createdAt, label: "Project created", kind: "created" },
    ...project.members
      // The owner's join coincides with creation — one entry is enough.
      .filter(
        (m) =>
          m.role !== "OWNER" ||
          m.joinedAt.getTime() - project.createdAt.getTime() > 60_000,
      )
      .map((m) => ({
        date: m.joinedAt,
        label:
          m.role === "OWNER"
            ? `${m.user.name} founded the project`
            : `${m.user.name} joined as ${m.title}`,
        kind: "member" as const,
      })),
    ...statusEvents.map((e) => {
      const payload = e.payload as { status?: string } | null;
      const status = payload?.status;
      return {
        date: e.createdAt,
        label: status
          ? `Status → ${statusLabels[status] ?? status}`
          : "Status changed",
        kind: "status" as const,
      };
    }),
    ...project.buildLog
      .filter((entry) => entry.type !== "UPDATE")
      .map((entry) => ({
        date: entry.createdAt,
        label: entry.title,
        kind: "milestone" as const,
      })),
  ];

  const twoWeeksAgo = weeksAgo(2).getTime();
  const launchEvent = statusEvents.find((e) => {
    const payload = e.payload as { status?: string } | null;
    return (
      e.type === "MVP_LAUNCHED" ||
      payload?.status === "MVP_LAUNCHED" ||
      payload?.status === "LAUNCHED"
    );
  });
  const momentum = computeMomentum({
    membersCount: project.members.length,
    openRolesCount: project.openRoles.length,
    updatesLast14d: activityDates.filter((d) => d.getTime() >= twoWeeksAgo)
      .length,
    lastLaunchAt: launchEvent?.createdAt ?? null,
  });
  const isLaunched =
    project.status === "MVP_LAUNCHED" || project.status === "LAUNCHED";
  const hasFounderNotes =
    project.notesWhy || project.notesProblem || project.notesLearned;
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
  // A pending invite addressed to the viewer — surfaced here because the
  // notification links to this page, not to the raw invite token URL.
  const viewerInvite = !isMember
    ? project.invites.find((i) => i.recipient?.id === userId)
    : undefined;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      {viewerInvite && (
        <section className="glass flex flex-wrap items-center justify-between gap-4 rounded-xl border-border-primary p-5">
          <div>
            <p className="text-sm font-semibold">
              You&apos;ve been invited to join as {viewerInvite.title}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Accepting adds you to the core team of {project.name}.
            </p>
          </div>
          <div className="flex gap-2">
            <form action={acceptProjectInvite.bind(null, viewerInvite.token)}>
              <button className="rounded-md btn-liquid px-4 py-2 text-xs font-semibold text-on-primary">
                Accept invite
              </button>
            </form>
            <form action={declineProjectInvite.bind(null, viewerInvite.token)}>
              <button className="rounded-md border border-border bg-glass px-4 py-2 text-xs font-semibold text-muted transition-colors hover:text-foreground">
                Decline
              </button>
            </form>
          </div>
        </section>
      )}

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
            {isAdmin && (
              <Link
                href={`/p/${project.slug}/edit`}
                title="Edit project"
                className="flex items-center gap-1.5 rounded-md border border-border bg-glass px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground"
              >
                <Pencil size={13} />
                Edit
              </Link>
            )}
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
            <ShareButton path={path} title={project.name} />
          </div>
        </div>

        {project.description && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            {project.description}
          </p>
        )}

        {(momentum.length > 0 || project.openTo.length > 0) && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <MomentumBadges badges={momentum} />
            {project.openTo.map((o) => (
              <span
                key={o}
                className="inline-flex rounded-full border border-border bg-glass px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-muted"
              >
                {openToLabels[o] ?? o}
              </span>
            ))}
          </div>
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
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-muted hover:text-accent"
            >
              <Globe size={13} /> Demo
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
        <div className="flex min-w-0 flex-col gap-10">
          {hasFounderNotes && (
            <section className="glass rounded-xl p-5 md:p-6">
              <h2 className="text-lg font-semibold">Founder notes</h2>
              <div className="mt-4 flex flex-col gap-4">
                {project.notesWhy && (
                  <FounderNote label="Why we build this" text={project.notesWhy} />
                )}
                {project.notesProblem && (
                  <FounderNote
                    label="What problem we solve"
                    text={project.notesProblem}
                  />
                )}
                {project.notesLearned && (
                  <FounderNote
                    label="What we learned this week"
                    text={project.notesLearned}
                  />
                )}
              </div>
            </section>
          )}

          {/* Build log */}
          <section className="flex min-w-0 flex-col gap-4">
            <h2 className="text-lg font-semibold">Build Log</h2>
            <ActivityGraph dates={activityDates} />
            {isMember && <BuildLogForm projectId={project.id} />}
            <BuildLogList
              entries={project.buildLog}
              currentUserId={userId}
              canModerate={isAdmin}
              path={path}
            />
          </section>

          {/* Project posts */}
          <section className="flex min-w-0 flex-col gap-4">
            <h2 className="text-lg font-semibold">Posts</h2>
            {isMember && (
              <PostComposer
                user={{ name: viewer.name, image: viewer.avatar }}
                projectId={project.id}
                placeholder={`Post an update from ${project.name}…`}
                hint="Appears on this page and in the global feed."
              />
            )}
            {projectPosts.length > 0 ? (
              <div className="flex flex-col gap-3">
                {projectPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={userId}
                    path={path}
                  />
                ))}
              </div>
            ) : (
              !isMember && (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-faint">
                  No posts from this project yet
                </div>
              )
            )}
          </section>
        </div>

        <div className="flex flex-col gap-10">
          <TeamSection
            projectId={project.id}
            projectSlug={project.slug}
            members={project.members}
            currentUserId={userId}
            viewerRole={currentMembership?.role ?? null}
          />

          <RolesSection
            projectId={project.id}
            roles={project.openRoles}
            isMember={isMember}
            currentUserId={userId}
          />

          {/* Journey: stage track + history timeline */}
          <section className="glass rounded-xl p-5">
            <h2 className="text-sm font-semibold">Journey</h2>
            <div className="mt-4">
              <StatusTrack status={project.status} />
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <ProjectTimeline events={timelineEvents} />
            </div>
          </section>

          {isLaunched && (
            <LaunchShareCard
              slug={project.slug}
              name={project.name}
              tagline={project.tagline}
            />
          )}

          <section className="glass rounded-xl p-5">
            <h2 className="text-sm font-semibold">Trust signals</h2>
            <div className="mt-4">
              <VerificationList
                websiteUrl={project.websiteUrl}
                githubUrl={project.githubUrl}
                demoUrl={project.demoUrl}
              />
            </div>
          </section>

          <ProjectScoreCard project={project} />

          {isMember && <ApplicationsSection applications={pendingApplications} />}

          {isMember && (
            <InviteTeammatesSection
              projectId={project.id}
              invites={project.invites}
              members={project.members}
              currentUserId={userId}
              isOwner={isOwner}
            />
          )}
        </div>
      </div>
    </div>
  );
}
