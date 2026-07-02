"use client";

import { useTransition } from "react";
import { updateProjectStatus } from "@/lib/actions/projects";
import { statusLabels } from "@/lib/format";

export function StatusSelect({
  projectId,
  status,
}: {
  projectId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) =>
        startTransition(() => updateProjectStatus(projectId, e.target.value))
      }
      className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-border-primary disabled:opacity-60"
      title="Change project status"
    >
      {Object.entries(statusLabels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
