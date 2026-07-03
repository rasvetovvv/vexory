"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { PenLine } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { createPost } from "@/lib/actions/social";

export function PostComposer({
  user,
  projectId,
  placeholder = "What are you building today?",
  hint = "Posts appear in the global feed and for your followers.",
}: {
  user: { name: string; image: string | null };
  /** When set, the post is published to this project's page as well. */
  projectId?: string;
  placeholder?: string;
  hint?: string;
}) {
  const [state, formAction, pending] = useActionState(createPost, undefined);
  const [expanded, setExpanded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
      setExpanded(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="glass rounded-xl p-4"
    >
      <div className="flex items-start gap-3">
        <Avatar name={user.name} image={user.image} size={36} />
        <div className="min-w-0 flex-1">
          {projectId && <input type="hidden" name="projectId" value={projectId} />}
          <textarea
            name="body"
            required
            maxLength={2000}
            rows={expanded ? 3 : 1}
            onFocus={() => setExpanded(true)}
            placeholder={placeholder}
            className="w-full resize-none rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-faint focus:border-border-primary"
          />
          {state?.error && (
            <p className="mt-2 text-xs text-danger">{state.error}</p>
          )}
          {expanded && (
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-faint">{hint}</p>
              <button
                type="submit"
                disabled={pending}
                className="flex shrink-0 items-center gap-1.5 rounded-md btn-liquid px-4 py-2 text-xs font-semibold text-on-primary disabled:opacity-60"
              >
                <PenLine size={13} />
                {pending ? "Posting…" : "Post"}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
