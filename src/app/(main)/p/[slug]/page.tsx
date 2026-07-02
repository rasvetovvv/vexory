import { PagePlaceholder } from "@/components/shell/page-placeholder";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PagePlaceholder
      title={`Project: ${slug}`}
      description="Project page — hero, roadmap, build log, core team and open roles."
    />
  );
}
