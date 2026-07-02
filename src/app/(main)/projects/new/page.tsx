import { PagePlaceholder } from "@/components/shell/page-placeholder";

export const metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <PagePlaceholder
      title="New project"
      description="Project creation wizard: name, tagline, status, tags and open roles."
    />
  );
}
