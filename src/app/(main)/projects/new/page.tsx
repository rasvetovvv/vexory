import { NewProjectForm } from "@/components/project/new-project-form";

export const metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
      <p className="mt-1 text-sm text-muted">
        Every project gets its own page with a build log, roadmap and open roles.
      </p>
      <div className="glass mt-6 rounded-xl p-6 md:p-8">
        <NewProjectForm />
      </div>
    </div>
  );
}
