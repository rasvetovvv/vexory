"use client";

import { useActionState, useRef, useEffect } from "react";
import { postBuildLog } from "@/lib/actions/projects";

const logTypes = [
  { value: "UPDATE", label: "Update" },
  { value: "MILESTONE", label: "Milestone" },
  { value: "LAUNCH", label: "Launch" },
  { value: "FUNDING", label: "Funding" },
];

export function BuildLogForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(postBuildLog, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="glass flex flex-col gap-3 rounded-lg p-4">
      <input type="hidden" name="projectId" value={projectId} />
      {state?.error && (
        <p className="rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-xs text-danger">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <select
          name="type"
          defaultValue="UPDATE"
          className="rounded-md border border-border bg-surface px-2.5 py-2 text-xs outline-none focus:border-border-primary"
        >
          {logTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          name="title"
          required
          minLength={2}
          maxLength={140}
          placeholder="What did you ship?"
          className="flex-1 rounded-md border border-border bg-surface px-3.5 py-2 text-sm outline-none placeholder:text-faint focus:border-border-primary"
        />
      </div>
      <textarea
        name="body"
        rows={2}
        maxLength={2000}
        placeholder="Details (optional)"
        className="rounded-md border border-border bg-surface px-3.5 py-2 text-sm outline-none placeholder:text-faint focus:border-border-primary"
      />
      <button
        type="submit"
        disabled={pending}
        className="self-end rounded-md bg-primary px-4 py-2 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Posting…" : "Post update"}
      </button>
    </form>
  );
}
