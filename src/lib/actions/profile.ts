"use server";

import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";

const optionalUrl = z.union([z.literal(""), z.string().trim().url()]).optional();

const profileSchema = z.object({
  name: z.string().trim().min(2).max(60),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Username: only letters, numbers and underscores"),
  headline: z.string().trim().max(100).optional(),
  bio: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(60).optional(),
  skills: z.string().trim().max(300).optional(),
  websiteUrl: optionalUrl,
  githubUrl: optionalUrl,
  twitterUrl: optionalUrl,
  linkedinUrl: optionalUrl,
});

const allowedImageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const maxAvatarBytes = 2 * 1024 * 1024;

export type ProfileState = { error?: string; saved?: boolean } | undefined;

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const userId = session.user.id;

  const parsed = profileSchema.safeParse(
    Object.fromEntries(
      [...formData.entries()].filter(([, v]) => typeof v === "string"),
    ),
  );
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const usernameTaken = await prisma.user.findFirst({
    where: { username: data.username, id: { not: userId } },
    select: { id: true },
  });
  if (usernameTaken) return { error: "This username is already taken" };

  const roles = formData
    .getAll("roles")
    .map(String)
    .filter((r): r is keyof typeof UserRole => r in UserRole)
    .slice(0, 5);

  let avatarPath: string | undefined;
  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    const ext = allowedImageTypes[avatar.type];
    if (!ext) return { error: "Avatar must be JPEG, PNG or WebP" };
    if (avatar.size > maxAvatarBytes) return { error: "Avatar must be under 2 MB" };

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const filename = `${userId}-${randomBytes(6).toString("hex")}.${ext}`;
    await writeFile(
      path.join(uploadsDir, filename),
      Buffer.from(await avatar.arrayBuffer()),
    );
    avatarPath = `/uploads/${filename}`;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      username: data.username,
      headline: data.headline || null,
      bio: data.bio || null,
      location: data.location || null,
      websiteUrl: data.websiteUrl || null,
      githubUrl: data.githubUrl || null,
      twitterUrl: data.twitterUrl || null,
      linkedinUrl: data.linkedinUrl || null,
      roles,
      skills: data.skills
        ? data.skills
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 20)
        : [],
      openForWork: formData.get("openForWork") === "on",
      ...(avatarPath ? { avatar: avatarPath } : {}),
    },
  });

  revalidatePath("/settings");
  revalidatePath(`/u/${data.username}`);
  return { saved: true };
}
