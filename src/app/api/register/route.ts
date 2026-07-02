import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email().toLowerCase(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Only letters, numbers and underscores"),
  password: z
    .string()
    .min(8)
    .max(100)
    .regex(/[0-9]/, "Must contain a digit")
    .regex(/[a-zA-Z]/, "Must contain a letter"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { name, email, username, password } = parsed.data;

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }
  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });
  if (existingUsername) {
    return NextResponse.json(
      { error: "This username is already taken" },
      { status: 409 },
    );
  }

  const passwordHash = await hash(password, 12);
  await prisma.user.create({
    data: { name, email, username, passwordHash },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
