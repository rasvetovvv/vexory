"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";

const onboardingSchema = z.object({
  roles: z.array(z.enum(UserRole)).min(1, "Choose at least one role").max(4),
  skills: z.string().trim().max(300).optional(),
  interests: z.string().trim().max(300).optional(),
  headline: z.string().trim().max(120).optional(),
  openForWork: z.union([z.literal("on"), z.literal("")]).optional(),
});

export type OnboardingState = { error?: string } | undefined;

function splitList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const roles = formData.getAll("roles").map(String);
  const parsed = onboardingSchema.safeParse({
    roles,
    skills: formData.get("skills")?.toString() ?? "",
    interests: formData.get("interests")?.toString() ?? "",
    headline: formData.get("headline")?.toString() ?? "",
    openForWork: formData.get("openForWork")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid onboarding data" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      roles: parsed.data.roles,
      skills: splitList(parsed.data.skills),
      interests: splitList(parsed.data.interests),
      headline: parsed.data.headline || null,
      openForWork: parsed.data.openForWork === "on",
      onboardingCompleted: true,
    },
  });

  redirect("/projects/new?from=onboarding");
}

export async function skipOnboarding() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingCompleted: true },
  });
  redirect("/feed");
}
