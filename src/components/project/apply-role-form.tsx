"use client";

import { useActionState } from "react";
import { applyToRole } from "@/lib/actions/projects";

export function ApplyRoleForm({ roleId }: { roleId: string }) {
  const [state, formAction, pending] = useActionState(applyToRole, undefined);

  return (
    <div>
      <form action={formAction} className="flex gap-2">
        <input type="hidden" name="roleId" value={roleId} />
        <input
          name="message"
          maxLength={1000}
          placeholder="Short intro (optional)"
          className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-xs outline-none placeholder:text-faint focus:border-border-primary"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md btn-liquid px-3.5 py-1.5 text-xs font-semibold text-on-primary disabled:opacity-60"
        >
          {pending ? "Sending…" : "Apply"}
        </button>
      </form>
      {state?.error && <p className="mt-1.5 text-xs text-danger">{state.error}</p>}
    </div>
  );
}
