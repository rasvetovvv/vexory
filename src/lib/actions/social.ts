"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  return session.user.id;
}

export async function toggleFollowUser(targetUserId: string, path: string) {
  const userId = await requireUserId();
  if (userId === targetUserId) return;

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followedUserId: {
        followerId: userId,
        followedUserId: targetUserId,
      },
    },
  });
  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({
      data: { followerId: userId, followedUserId: targetUserId },
    });
    await prisma.notification.create({
      data: { recipientId: targetUserId, actorId: userId, type: "NEW_FOLLOWER" },
    });
  }
  revalidatePath(path);
}

export async function toggleFollowProject(projectId: string, path: string) {
  const userId = await requireUserId();

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followedProjectId: {
        followerId: userId,
        followedProjectId: projectId,
      },
    },
  });
  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({
      data: { followerId: userId, followedProjectId: projectId },
    });
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (project && project.ownerId !== userId) {
      await prisma.notification.create({
        data: {
          recipientId: project.ownerId,
          actorId: userId,
          type: "PROJECT_FOLLOWED",
          projectId,
        },
      });
    }
  }
  revalidatePath(path);
}

export async function toggleLike(entryId: string, path: string) {
  const userId = await requireUserId();

  const existing = await prisma.like.findUnique({
    where: { userId_buildLogEntryId: { userId, buildLogEntryId: entryId } },
  });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({
      data: { userId, buildLogEntryId: entryId },
    });
    const entry = await prisma.buildLogEntry.findUnique({
      where: { id: entryId },
      select: { authorId: true, projectId: true },
    });
    if (entry && entry.authorId !== userId) {
      await prisma.notification.create({
        data: {
          recipientId: entry.authorId,
          actorId: userId,
          type: "LIKE",
          projectId: entry.projectId,
          entryId,
        },
      });
    }
  }
  revalidatePath(path);
}

export async function addComment(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string } | undefined> {
  const userId = await requireUserId();
  const entryId = String(formData.get("entryId") ?? "");
  const path = String(formData.get("path") ?? "/feed");
  const body = String(formData.get("body") ?? "").trim();
  if (!entryId || !body) return { error: "Comment cannot be empty" };
  if (body.length > 1000) return { error: "Comment is too long" };

  const entry = await prisma.buildLogEntry.findUnique({
    where: { id: entryId },
    select: { authorId: true, projectId: true },
  });
  if (!entry) return { error: "Entry not found" };

  await prisma.comment.create({
    data: { userId, buildLogEntryId: entryId, body },
  });
  if (entry.authorId !== userId) {
    await prisma.notification.create({
      data: {
        recipientId: entry.authorId,
        actorId: userId,
        type: "COMMENT",
        projectId: entry.projectId,
        entryId,
      },
    });
  }
  revalidatePath(path);
  return undefined;
}

export async function toggleBookmark(projectId: string, path: string) {
  const userId = await requireUserId();

  const existing = await prisma.bookmark.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
  } else {
    await prisma.bookmark.create({ data: { userId, projectId } });
  }
  revalidatePath(path);
  revalidatePath("/bookmarks");
}

export async function markAllNotificationsRead() {
  const userId = await requireUserId();
  await prisma.notification.updateMany({
    where: { recipientId: userId, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
}
