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

async function requireMembership(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) throw new Error("Not a member of this project");
  return member;
}

export type ChatActionState = { error?: string } | undefined;

export async function sendChatMessage(
  _prev: ChatActionState,
  formData: FormData,
): Promise<ChatActionState> {
  const userId = await requireUserId();
  const projectId = String(formData.get("projectId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!projectId) return { error: "Missing project" };
  if (!body) return { error: "Message cannot be empty" };
  if (body.length > 2000) return { error: "Message is too long" };

  await requireMembership(projectId, userId);

  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { slug: true },
  });
  await prisma.chatMessage.create({
    data: { projectId, authorId: userId, body },
  });
  revalidatePath(`/p/${project.slug}/chat`);
  return undefined;
}

export async function deleteChatMessage(messageId: string) {
  const userId = await requireUserId();
  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    include: { project: { select: { id: true, slug: true } } },
  });
  if (!message) return;

  let canDelete = message.authorId === userId;
  if (!canDelete) {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: message.project.id, userId },
      },
    });
    canDelete = !!member && ["OWNER", "ADMIN"].includes(member.role);
  }
  if (!canDelete) return;

  await prisma.chatMessage.delete({ where: { id: messageId } });
  revalidatePath(`/p/${message.project.slug}/chat`);
}
