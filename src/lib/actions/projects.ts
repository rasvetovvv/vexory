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
  ProjectStatus,
  RoadmapStatus,
  RoleCompensation,
} from "@/generated/prisma/enums";

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
});

export async function postBuildLog(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = buildLogSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { projectId, type, title, body } = parsed.data;
  await requireMembership(projectId, userId);

  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { slug: true, name: true },
  });

  await prisma.buildLogEntry.create({
    data: { projectId, authorId: userId, type, title, body: body || null },
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
  if (existing) return { error: "You already applied to this role" };

  await prisma.roleApplication.create({
    data: { roleId, userId, message: message || null },
  });
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
