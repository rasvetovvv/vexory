"use client";

import { useActionState, useTransition } from "react";
import { updateProjectDetails, deleteProject } from "@/lib/actions/projects";

const inputClass =
  "rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-faint focus:border-border-primary";

type ProjectData = {
  id: string;
  name: string;
  tagline: string;
  description: string | null;
  websiteUrl: string | null;
  githubUrl: string | null;
  demoUrl: string | null;
  tags: string[];
  openTo: string[];
  notesWhy: string | null;
  notesProblem: string | null;
  notesLearned: string | null;
};

const openToOptions = [
  { value: "COLLABORATE", label: "Open to collaborate" },
  { value: "INVESTMENT", label: "Open for investment" },
  { value: "BETA_USERS", label: "Open for beta users" },
  { value: "CONTRIBUTORS", label: "Open for contributors" },
];

export function EditProjectForm({ project }: { project: ProjectData }) {
  const [state, formAction, pending] = useActionState(updateProjectDetails, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={project.id} />
      {state?.error && (
        <p className="rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-xs text-danger">
          {state.error}
        </p>
      )}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Project name</span>
        <input name="name" defaultValue={project.name} required minLength={2} maxLength={60} className={inputClass} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Tagline</span>
        <input name="tagline" defaultValue={project.tagline} required minLength={4} maxLength={140} className={inputClass} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Description</span>
        <textarea
          name="description"
          defaultValue={project.description ?? ""}
          rows={5}
          maxLength={5000}
          placeholder="What are you building, for whom, and why now?"
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Website</span>
          <input name="websiteUrl" type="url" defaultValue={project.websiteUrl ?? ""} placeholder="https://…" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">GitHub</span>
          <input name="githubUrl" type="url" defaultValue={project.githubUrl ?? ""} placeholder="https://github.com/…" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Demo</span>
          <input name="demoUrl" type="url" defaultValue={project.demoUrl ?? ""} placeholder="https://demo…" className={inputClass} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Tags</span>
        <input
          name="tags"
          defaultValue={project.tags.join(", ")}
          placeholder="ai, saas, movies (comma-separated)"
          className={inputClass}
        />
      </label>

      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="font-medium">The project is currently…</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {openToOptions.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border bg-glass px-3 py-2.5 transition-colors hover:border-border-strong has-[:checked]:border-border-primary has-[:checked]:bg-primary-muted"
            >
              <input
                type="checkbox"
                name="openTo"
                value={opt.value}
                defaultChecked={project.openTo.includes(opt.value)}
                className="accent-[#7c5cff]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-sm font-medium">
          Founder notes{" "}
          <span className="font-normal text-faint">
            — shown on the project page, all optional
          </span>
        </legend>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Why we build this</span>
          <textarea name="notesWhy" defaultValue={project.notesWhy ?? ""} rows={2} maxLength={1000} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">What problem we solve</span>
          <textarea name="notesProblem" defaultValue={project.notesProblem ?? ""} rows={2} maxLength={1000} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">What we learned this week</span>
          <textarea name="notesLearned" defaultValue={project.notesLearned ?? ""} rows={2} maxLength={1000} className={inputClass} />
        </label>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 self-start rounded-md btn-liquid px-5 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

export function DeleteProjectForm({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-xl border border-danger/30 p-5">
      <h2 className="text-sm font-semibold text-danger">Danger zone</h2>
      <p className="mt-1 text-xs text-muted">
        Deleting a project removes its build log, roadmap, roles, applications
        and followers. This cannot be undone.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            window.confirm(
              `Delete "${projectName}" permanently? This cannot be undone.`,
            )
          ) {
            const formData = new FormData();
            formData.set("projectId", projectId);
            startTransition(() => deleteProject(formData));
          }
        }}
        className="mt-3 rounded-md border border-danger/40 px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger-muted disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete project"}
      </button>
    </div>
  );
}
