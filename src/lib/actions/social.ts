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

// ---------- Posts ----------

export type PostActionState = { error?: string } | undefined;

export async function createPost(
  _prev: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const userId = await requireUserId();
  const body = String(formData.get("body") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim() || null;
  if (!body) return { error: "Post cannot be empty" };
  if (body.length > 2000) return { error: "Post is too long (max 2000 characters)" };

  // Posting as a project is a team privilege.
  let projectSlug: string | null = null;
  if (projectId) {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      include: { project: { select: { slug: true } } },
    });
    if (!member) return { error: "Only team members can post to a project" };
    projectSlug = member.project.slug;
  }

  await prisma.post.create({ data: { authorId: userId, projectId, body } });
  revalidatePath("/feed");
  if (projectSlug) revalidatePath(`/p/${projectSlug}`);
  return undefined;
}

export async function deletePost(postId: string, path: string) {
  const userId = await requireUserId();
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (!post || post.authorId !== userId) return;
  await prisma.post.delete({ where: { id: postId } });
  revalidatePath(path);
}

export async function togglePostLike(postId: string, path: string) {
  const userId = await requireUserId();

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { userId, postId } });
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (post && post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          recipientId: post.authorId,
          actorId: userId,
          type: "LIKE",
          postId,
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

// Comments attach to either a build log entry (entryId) or a post (postId).
export async function addComment(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string } | undefined> {
  const userId = await requireUserId();
  const entryId = String(formData.get("entryId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  const path = String(formData.get("path") ?? "/feed");
  const body = String(formData.get("body") ?? "").trim();
  if ((!entryId && !postId) || !body) return { error: "Comment cannot be empty" };
  if (body.length > 1000) return { error: "Comment is too long" };

  if (postId) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post) return { error: "Post not found" };

    await prisma.comment.create({ data: { userId, postId, body } });
    if (post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          recipientId: post.authorId,
          actorId: userId,
          type: "COMMENT",
          postId,
        },
      });
    }
    revalidatePath(path);
    return undefined;
  }

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

export async function deleteComment(commentId: string, path: string) {
  const userId = await requireUserId();
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      entry: { select: { projectId: true } },
      post: { select: { authorId: true } },
    },
  });
  if (!comment) return;

  let canDelete = comment.userId === userId;
  if (!canDelete && comment.post) {
    // Post authors moderate their own post's thread.
    canDelete = comment.post.authorId === userId;
  }
  if (!canDelete && comment.entry) {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: comment.entry.projectId, userId },
      },
    });
    canDelete = !!member && ["OWNER", "ADMIN"].includes(member.role);
  }
  if (!canDelete) return;

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(path);
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
