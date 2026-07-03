"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import {
  BuildLogType,
  FeedEventType,
  ProjectOpenTo,
  ProjectStatus,
  RoadmapStatus,
  RoleCompensation,
} from "@/generated/prisma/enums";
import { publicBaseUrl } from "@/lib/urls";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  return session.user.id;
}

async function requireMembership(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) throw new Error("Not a member of this project");
  return member;
}

// ---------- Create project ----------

const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(60),
  tagline: z.string().trim().min(4).max(140),
  description: z.string().trim().max(5000).optional(),
  status: z.enum(ProjectStatus),
  websiteUrl: z.union([z.literal(""), z.string().trim().url()]).optional(),
  githubUrl: z.union([z.literal(""), z.string().trim().url()]).optional(),
  tags: z.string().trim().max(200).optional(),
  memberTitle: z.string().trim().min(2).max(60),
});

export type ActionState = { error?: string } | undefined;

export async function createProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = createProjectSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, tagline, description, status, websiteUrl, githubUrl, tags, memberTitle } =
    parsed.data;

  const base = slugify(name) || "project";
  let slug = base;
  for (let i = 0; i < 10; i++) {
    const taken = await prisma.project.findUnique({ where: { slug } });
    if (!taken) break;
    slug = `${base}-${Math.floor(100 + Math.random() * 900)}`;
  }

  const project = await prisma.project.create({
    data: {
      slug,
      name,
      tagline,
      description: description || null,
      status,
      websiteUrl: websiteUrl || null,
      githubUrl: githubUrl || null,
      tags: tags
        ? tags
            .split(",")
            .map((t) => slugify(t))
            .filter(Boolean)
            .slice(0, 8)
        : [],
      ownerId: userId,
      members: {
        create: { userId, title: memberTitle, role: "OWNER" },
      },
      feedEvents: {
        create: {
          type: FeedEventType.PROJECT_CREATED,
          actorId: userId,
          payload: { name, tagline },
        },
      },
    },
  });

  redirect(`/p/${project.slug}`);
}

// ---------- Edit project ----------

const updateProjectSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().trim().min(2).max(60),
  tagline: z.string().trim().min(4).max(140),
  description: z.string().trim().max(5000).optional(),
  websiteUrl: z.union([z.literal(""), z.string().trim().url()]).optional(),
  githubUrl: z.union([z.literal(""), z.string().trim().url()]).optional(),
  demoUrl: z.union([z.literal(""), z.string().trim().url()]).optional(),
  tags: z.string().trim().max(200).optional(),
  notesWhy: z.string().trim().max(1000).optional(),
  notesProblem: z.string().trim().max(1000).optional(),
  notesLearned: z.string().trim().max(1000).optional(),
});

export async function updateProjectDetails(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = updateProjectSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  // Checkbox group: getAll, not Object.fromEntries (which keeps one value).
  const openToParsed = z
    .array(z.enum(ProjectOpenTo))
    .safeParse(formData.getAll("openTo").map(String));
  if (!openToParsed.success) return { error: "Invalid open-to selection" };
  const {
    projectId,
    name,
    tagline,
    description,
    websiteUrl,
    githubUrl,
    demoUrl,
    tags,
    notesWhy,
    notesProblem,
    notesLearned,
  } = parsed.data;
  const member = await requireMembership(projectId, userId);
  if (!["OWNER", "ADMIN"].includes(member.role)) {
    return { error: "Only project admins can edit the project" };
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      name,
      tagline,
      description: description || null,
      websiteUrl: websiteUrl || null,
      githubUrl: githubUrl || null,
      demoUrl: demoUrl || null,
      openTo: openToParsed.data,
      notesWhy: notesWhy || null,
      notesProblem: notesProblem || null,
      notesLearned: notesLearned || null,
      tags: tags
        ? tags
            .split(",")
            .map((t) => slugify(t))
            .filter(Boolean)
            .slice(0, 8)
        : [],
    },
  });

  revalidatePath(`/p/${project.slug}`);
  revalidatePath(`/showcase/${project.slug}`);
  revalidatePath("/projects");
  redirect(`/p/${project.slug}`);
}

export async function deleteProject(formData: FormData) {
  const userId = await requireUserId();
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return;

  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { ownerId: true, slug: true },
  });
  if (project.ownerId !== userId) return;

  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/projects");
  revalidatePath("/feed");
  redirect("/projects");
}

// ---------- Update status ----------

export async function updateProjectStatus(projectId: string, status: string) {
  const userId = await requireUserId();
  await requireMembership(projectId, userId);
  const parsed = z.enum(ProjectStatus).safeParse(status);
  if (!parsed.success) return;

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { status: parsed.data },
  });

  const isLaunch =
    parsed.data === ProjectStatus.MVP_LAUNCHED ||
    parsed.data === ProjectStatus.LAUNCHED;
  await prisma.feedEvent.create({
    data: {
      type: isLaunch ? FeedEventType.MVP_LAUNCHED : FeedEventType.STATUS_CHANGED,
      actorId: userId,
      projectId,
      payload: { name: project.name, status: parsed.data },
    },
  });
  revalidatePath(`/p/${project.slug}`);
  revalidatePath("/feed");
}

// ---------- Build log ----------

const buildLogSchema = z.object({
  projectId: z.string().min(1),
  type: z.enum(BuildLogType),
  title: z.string().trim().min(2).max(140),
  body: z.string().trim().max(2000).optional(),
  proof: z.string().trim().max(1000).optional(),
});

// Build proof: free-form field, keep whatever parses as http(s) URLs.
function parseProofUrls(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .filter((part) => {
      try {
        const url = new URL(part);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    })
    .slice(0, 4);
}

export async function postBuildLog(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = buildLogSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { projectId, type, title, body, proof } = parsed.data;
  await requireMembership(projectId, userId);

  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { slug: true, name: true },
  });

  await prisma.buildLogEntry.create({
    data: {
      projectId,
      authorId: userId,
      type,
      title,
      body: body || null,
      proofUrls: parseProofUrls(proof),
    },
  });
  await prisma.feedEvent.create({
    data: {
      type:
        type === BuildLogType.FUNDING
          ? FeedEventType.FUNDING_RAISED
          : type === BuildLogType.LAUNCH
            ? FeedEventType.MVP_LAUNCHED
            : FeedEventType.BUILD_LOG_POSTED,
      actorId: userId,
      projectId,
      payload: { name: project.name, title, logType: type },
    },
  });

  revalidatePath(`/p/${project.slug}`);
  revalidatePath("/feed");
  return undefined;
}

export async function deleteBuildLogEntry(entryId: string) {
  const userId = await requireUserId();
  const entry = await prisma.buildLogEntry.findUniqueOrThrow({
    where: { id: entryId },
    include: { project: { select: { id: true, slug: true } } },
  });
  const member = await requireMembership(entry.project.id, userId);
  const canDelete =
    entry.authorId === userId || ["OWNER", "ADMIN"].includes(member.role);
  if (!canDelete) return;

  await prisma.buildLogEntry.delete({ where: { id: entryId } });
  revalidatePath(`/p/${entry.project.slug}`);
}

// ---------- Roadmap ----------

const roadmapSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().max(500).optional(),
});

export async function addRoadmapItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = roadmapSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { projectId, title, description } = parsed.data;
  await requireMembership(projectId, userId);

  const last = await prisma.roadmapItem.findFirst({
    where: { projectId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  await prisma.roadmapItem.create({
    data: {
      projectId,
      title,
      description: description || null,
      order: (last?.order ?? 0) + 1,
    },
  });
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { slug: true },
  });
  revalidatePath(`/p/${project.slug}`);
  return undefined;
}

export async function cycleRoadmapStatus(itemId: string) {
  const userId = await requireUserId();
  const item = await prisma.roadmapItem.findUniqueOrThrow({
    where: { id: itemId },
    include: { project: { select: { id: true, slug: true } } },
  });
  await requireMembership(item.project.id, userId);

  const next =
    item.status === RoadmapStatus.PLANNED
      ? RoadmapStatus.IN_PROGRESS
      : item.status === RoadmapStatus.IN_PROGRESS
        ? RoadmapStatus.DONE
        : RoadmapStatus.PLANNED;
  await prisma.roadmapItem.update({ where: { id: itemId }, data: { status: next } });
  revalidatePath(`/p/${item.project.slug}`);
}

export async function deleteRoadmapItem(itemId: string) {
  const userId = await requireUserId();
  const item = await prisma.roadmapItem.findUniqueOrThrow({
    where: { id: itemId },
    include: { project: { select: { id: true, slug: true } } },
  });
  await requireMembership(item.project.id, userId);
  await prisma.roadmapItem.delete({ where: { id: itemId } });
  revalidatePath(`/p/${item.project.slug}`);
}

// ---------- Open roles ----------

const openRoleSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).optional(),
  compensation: z.enum(RoleCompensation),
  hoursPerWeek: z.coerce.number().int().min(1).max(80).optional().or(z.literal("")),
});

export async function openRole(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const entries = Object.fromEntries(formData.entries());
  const parsed = openRoleSchema.safeParse(entries);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { projectId, title, description, compensation, hoursPerWeek } = parsed.data;
  await requireMembership(projectId, userId);

  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { slug: true, name: true },
  });
  await prisma.openRole.create({
    data: {
      projectId,
      title,
      description: description || null,
      compensation,
      hoursPerWeek: typeof hoursPerWeek === "number" ? hoursPerWeek : null,
    },
  });
  await prisma.feedEvent.create({
    data: {
      type: FeedEventType.ROLE_OPENED,
      actorId: userId,
      projectId,
      payload: { name: project.name, role: title, compensation },
    },
  });
  revalidatePath(`/p/${project.slug}`);
  revalidatePath("/roles");
  revalidatePath("/feed");
  return undefined;
}

export async function closeRole(roleId: string) {
  const userId = await requireUserId();
  const role = await prisma.openRole.findUniqueOrThrow({
    where: { id: roleId },
    include: { project: { select: { id: true, slug: true } } },
  });
  await requireMembership(role.project.id, userId);
  await prisma.openRole.update({ where: { id: roleId }, data: { status: "CLOSED" } });
  revalidatePath(`/p/${role.project.slug}`);
  revalidatePath("/roles");
}

export async function applyToRole(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const roleId = String(formData.get("roleId") ?? "");
  const message = String(formData.get("message") ?? "").trim().slice(0, 1000);
  if (!roleId) return { error: "Missing role" };

  const role = await prisma.openRole.findUniqueOrThrow({
    where: { id: roleId },
    include: { project: { select: { id: true, slug: true, ownerId: true, name: true } } },
  });
  if (role.status !== "OPEN") return { error: "This role is no longer open" };

  const existing = await prisma.roleApplication.findUnique({
    where: { roleId_userId: { roleId, userId } },
  });
  if (existing && existing.status !== "WITHDRAWN") {
    return { error: "You already applied to this role" };
  }

  if (existing) {
    // Re-applying after a withdrawal revives the old application.
    await prisma.roleApplication.update({
      where: { id: existing.id },
      data: { status: "PENDING", message: message || null, createdAt: new Date() },
    });
  } else {
    await prisma.roleApplication.create({
      data: { roleId, userId, message: message || null },
    });
  }
  await prisma.notification.create({
    data: {
      recipientId: role.project.ownerId,
      actorId: userId,
      type: "ROLE_APPLICATION",
      projectId: role.project.id,
    },
  });
  revalidatePath(`/p/${role.project.slug}`);
  return undefined;
}

export async function withdrawApplication(applicationId: string) {
  const userId = await requireUserId();
  const application = await prisma.roleApplication.findUniqueOrThrow({
    where: { id: applicationId },
    include: { role: { include: { project: { select: { slug: true } } } } },
  });
  if (application.userId !== userId) return;
  if (application.status !== "PENDING") return;

  await prisma.roleApplication.update({
    where: { id: applicationId },
    data: { status: "WITHDRAWN" },
  });
  revalidatePath("/roles");
  revalidatePath(`/p/${application.role.project.slug}`);
}

export async function acceptApplication(applicationId: string) {
  const userId = await requireUserId();
  const application = await prisma.roleApplication.findUniqueOrThrow({
    where: { id: applicationId },
    include: {
      role: {
        include: { project: { select: { id: true, slug: true, name: true } } },
      },
    },
  });
  const project = application.role.project;
  await requireMembership(project.id, userId);
  if (application.status !== "PENDING") return;

  const alreadyMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId: project.id, userId: application.userId },
    },
  });
  await prisma.$transaction([
    prisma.roleApplication.update({
      where: { id: applicationId },
      data: { status: "ACCEPTED" },
    }),
    ...(alreadyMember
      ? []
      : [
          prisma.projectMember.create({
            data: {
              projectId: project.id,
              userId: application.userId,
              title: application.role.title,
            },
          }),
        ]),
    prisma.notification.create({
      data: {
        recipientId: application.userId,
        actorId: userId,
        type: "APPLICATION_ACCEPTED",
        projectId: project.id,
      },
    }),
    prisma.feedEvent.create({
      data: {
        type: FeedEventType.MEMBER_JOINED,
        actorId: application.userId,
        projectId: project.id,
        payload: { name: project.name, role: application.role.title },
      },
    }),
  ]);

  revalidatePath(`/p/${project.slug}`);
  revalidatePath("/feed");
}

export async function rejectApplication(applicationId: string) {
  const userId = await requireUserId();
  const application = await prisma.roleApplication.findUniqueOrThrow({
    where: { id: applicationId },
    include: { role: { include: { project: { select: { id: true, slug: true } } } } },
  });
  await requireMembership(application.role.project.id, userId);
  if (application.status !== "PENDING") return;

  await prisma.roleApplication.update({
    where: { id: applicationId },
    data: { status: "REJECTED" },
  });
  revalidatePath(`/p/${application.role.project.slug}`);
}

// ---------- Project invites ----------

export type InviteActionState = { error?: string; inviteUrl?: string } | undefined;

const inviteSchema = z.object({
  projectId: z.string().min(1),
  emailOrUsername: z.string().trim().max(120).optional(),
  title: z.string().trim().min(2).max(80),
  role: z.enum(["ADMIN", "MEMBER"]),
});

async function requireProjectAdmin(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    throw new Error("Only project admins can manage invites");
  }
  return member;
}

export async function createProjectInvite(
  _prev: InviteActionState,
  formData: FormData,
): Promise<InviteActionState> {
  const userId = await requireUserId();
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid invite" };
  }
  const { projectId, emailOrUsername, title, role } = parsed.data;
  await requireProjectAdmin(projectId, userId);

  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { slug: true, name: true },
  });

  const target = (emailOrUsername ?? "").trim().replace(/^@/, "").toLowerCase();
  const recipient = target
    ? await prisma.user.findFirst({
        where: target.includes("@") ? { email: target } : { username: target },
        select: { id: true, email: true },
      })
    : null;

  const invite = await prisma.projectInvite.create({
    data: {
      projectId,
      senderId: userId,
      recipientId: recipient?.id ?? null,
      email: recipient ? recipient.email : target.includes("@") ? target : null,
      title,
      role,
      token: crypto.randomUUID().replaceAll("-", ""),
      expiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000),
    },
  });

  if (recipient?.id) {
    await prisma.notification.create({
      data: {
        recipientId: recipient.id,
        actorId: userId,
        type: "MEMBER_INVITED",
        projectId,
      },
    });
  }

  revalidatePath(`/p/${project.slug}`);
  revalidatePath("/notifications");
  return { inviteUrl: `${publicBaseUrl()}/invite/${invite.token}` };
}

export async function revokeProjectInvite(inviteId: string) {
  const userId = await requireUserId();
  const invite = await prisma.projectInvite.findUniqueOrThrow({
    where: { id: inviteId },
    include: { project: { select: { id: true, slug: true } } },
  });
  await requireProjectAdmin(invite.project.id, userId);
  await prisma.projectInvite.update({
    where: { id: inviteId },
    data: { status: "REVOKED" },
  });
  revalidatePath(`/p/${invite.project.slug}`);
}

export async function acceptProjectInvite(token: string) {
  const userId = await requireUserId();
  const invite = await prisma.projectInvite.findUniqueOrThrow({
    where: { token },
    include: { project: { select: { id: true, slug: true, name: true } } },
  });
  if (invite.status !== "PENDING") return;
  if (invite.expiresAt && invite.expiresAt < new Date()) return;
  if (invite.recipientId && invite.recipientId !== userId) return;

  const alreadyMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: invite.projectId, userId } },
  });

  await prisma.$transaction([
    prisma.projectInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED", recipientId: userId },
    }),
    ...(alreadyMember
      ? []
      : [
          prisma.projectMember.create({
            data: {
              projectId: invite.projectId,
              userId,
              title: invite.title,
              role: invite.role,
            },
          }),
        ]),
    prisma.feedEvent.create({
      data: {
        type: FeedEventType.MEMBER_JOINED,
        actorId: userId,
        projectId: invite.projectId,
        payload: { name: invite.project.name, role: invite.title },
      },
    }),
  ]);

  revalidatePath(`/p/${invite.project.slug}`);
  revalidatePath("/feed");
  redirect(`/p/${invite.project.slug}`);
}

export async function declineProjectInvite(token: string) {
  const userId = await requireUserId();
  const invite = await prisma.projectInvite.findUniqueOrThrow({
    where: { token },
    include: { project: { select: { slug: true } } },
  });
  if (invite.recipientId && invite.recipientId !== userId) return;
  await prisma.projectInvite.update({
    where: { id: invite.id },
    data: { status: "DECLINED" },
  });
  revalidatePath(`/p/${invite.project.slug}`);
}

// ---------- Team management ----------

export async function removeProjectMember(formData: FormData) {
  const userId = await requireUserId();
  const projectId = String(formData.get("projectId") ?? "");
  const memberUserId = String(formData.get("memberUserId") ?? "");
  if (!projectId || !memberUserId || memberUserId === userId) return;

  const [actor, target, project] = await Promise.all([
    prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    }),
    prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: memberUserId } },
    }),
    prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: { slug: true },
    }),
  ]);
  if (!actor || !target) return;
  // The owner can remove anyone; admins can remove plain members only.
  if (target.role === "OWNER") return;
  const allowed =
    actor.role === "OWNER" || (actor.role === "ADMIN" && target.role === "MEMBER");
  if (!allowed) return;

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId: memberUserId } },
  });
  revalidatePath(`/p/${project.slug}`);
  revalidatePath(`/p/${project.slug}/chat`);
}

export async function leaveProject(formData: FormData) {
  const userId = await requireUserId();
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return;

  const [membership, project] = await Promise.all([
    prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    }),
    prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: { slug: true },
    }),
  ]);
  // The owner cannot leave: transfer ownership first.
  if (!membership || membership.role === "OWNER") return;

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });
  revalidatePath(`/p/${project.slug}`);
  redirect(`/p/${project.slug}`);
}

export async function transferProjectOwnership(formData: FormData) {
  const userId = await requireUserId();
  const projectId = String(formData.get("projectId") ?? "");
  const newOwnerId = String(formData.get("newOwnerId") ?? "");
  if (!projectId || !newOwnerId || newOwnerId === userId) return;

  const [project, ownerMembership, newOwnerMembership] = await Promise.all([
    prisma.project.findUniqueOrThrow({ where: { id: projectId }, select: { slug: true, ownerId: true } }),
    prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } } }),
    prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId: newOwnerId } } }),
  ]);
  if (project.ownerId !== userId || ownerMembership?.role !== "OWNER" || !newOwnerMembership) return;

  await prisma.$transaction([
    prisma.project.update({ where: { id: projectId }, data: { ownerId: newOwnerId } }),
    prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role: "ADMIN" },
    }),
    prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId: newOwnerId } },
      data: { role: "OWNER" },
    }),
  ]);
  revalidatePath(`/p/${project.slug}`);
}
