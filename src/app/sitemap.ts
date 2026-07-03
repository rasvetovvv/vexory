import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const baseUrl = "https://network.vexory.xyz";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ];

  try {
    const projects = await prisma.project.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
    });

    return [
      ...staticRoutes,
      ...projects.map((project) => ({
        url: `${baseUrl}/showcase/${project.slug}`,
        lastModified: project.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.75,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
