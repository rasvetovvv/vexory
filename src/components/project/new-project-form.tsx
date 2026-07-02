"use client";

import { useActionState } from "react";
import { createProject } from "@/lib/actions/projects";
import { statusLabels } from "@/lib/format";

const inputClass =
  "rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-faint focus:border-border-primary";

export function NewProjectForm() {
  const [state, formAction, pending] = useActionState(createProject, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <p className="rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-xs text-danger">
          {state.error}
        </p>
      )}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Project name</span>
        <input name="name" required minLength={2} maxLength={60} placeholder="Picksy" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Tagline</span>
        <input
          name="tagline"
          required
          minLength={4}
          maxLength={140}
          placeholder="AI Movie Recommendation Platform"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Description</span>
        <textarea
          name="description"
          rows={4}
          maxLength={5000}
          placeholder="What are you building, for whom, and why now?"
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Status</span>
          <select name="status" defaultValue="BUILDING" className={inputClass}>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Your role in the team</span>
          <input
            name="memberTitle"
            required
            minLength={2}
            maxLength={60}
            placeholder="Founder / Backend"
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Website</span>
          <input name="websiteUrl" type="url" placeholder="https://…" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">GitHub</span>
          <input name="githubUrl" type="url" placeholder="https://github.com/…" className={inputClass} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Tags</span>
        <input name="tags" placeholder="ai, saas, movies (comma-separated)" className={inputClass} />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md btn-liquid px-4 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create project"}
      </button>
    </form>
  );
}
