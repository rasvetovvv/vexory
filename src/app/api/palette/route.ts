import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// Lightweight search backing the ⌘K command palette. Returns the top few
// projects, people and open roles for a query — the full /search page stays
// the destination for exhaustive results.
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().slice(0, 80);
  if (query.length < 2) {
    return NextResponse.json({ projects: [], people: [], roles: [] });
  }

  const [projects, people, roles] = await Promise.all([
    prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { tagline: { contains: query, mode: "insensitive" } },
          { tags: { has: query.toLowerCase() } },
        ],
      },
      select: { id: true, name: true, slug: true, tagline: true, status: true },
      take: 5,
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
          { headline: { contains: query, mode: "insensitive" } },
          { skills: { has: query.toLowerCase() } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        headline: true,
      },
      take: 5,
    }),
    prisma.openRole.findMany({
      where: {
        status: "OPEN",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        project: { select: { name: true, slug: true } },
      },
      take: 4,
    }),
  ]);

  return NextResponse.json({ projects, people, roles });
}
