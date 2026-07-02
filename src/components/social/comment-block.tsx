"use client";

import { useState, useActionState, useRef, useEffect } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { addComment } from "@/lib/actions/social";
import { timeAgo } from "@/lib/format";

type CommentData = {
  id: string;
  body: string;
  createdAt: Date;
  user: { name: string; username: string; avatar: string | null };
};

export function CommentBlock({
  entry,
  path,
}: {
  entry: { id: string; comments: CommentData[] };
  path: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addComment, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <div className="min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-muted transition-colors hover:text-foreground"
      >
        <MessageCircle size={15} />
        {entry.comments.length}
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-3 border-l border-border pl-4">
          {entry.comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar name={c.user.name} image={c.user.avatar} size={24} />
              <div className="min-w-0">
                <p className="text-xs">
                  <Link
                    href={`/u/${c.user.username}`}
                    className="font-semibold hover:text-accent"
                  >
                    {c.user.name}
                  </Link>{" "}
                  <span className="text-faint">{timeAgo(c.createdAt)}</span>
                </p>
                <p className="mt-0.5 text-sm text-muted">{c.body}</p>
              </div>
            </div>
          ))}

          <form ref={formRef} action={formAction} className="flex gap-2">
            <input type="hidden" name="entryId" value={entry.id} />
            <input type="hidden" name="path" value={path} />
            <input
              name="body"
              required
              maxLength={1000}
              placeholder="Write a comment…"
              className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-xs outline-none placeholder:text-faint focus:border-border-primary"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              Send
            </button>
          </form>
          {state?.error && <p className="text-xs text-danger">{state.error}</p>}
        </div>
      )}
    </div>
  );
}
