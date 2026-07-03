"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  acceptProjectInvite,
  createProjectInvite,
  declineProjectInvite,
  revokeProjectInvite,
  transferProjectOwnership,
} from "@/lib/actions/projects";

const inputClass =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-faint focus:border-border-primary";

type Invite = {
  id: string;
  email: string | null;
  title: string;
  role: string;
  token: string;
  status: string;
  recipientId: string | null;
  recipient: { name: string; username: string } | null;
};

type Member = {
  userId: string;
  role: string;
  user: { name: string; username: string };
};

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          // `url` may be relative; resolve against the current origin here so
          // no window access happens during render (SSR-safe).
          const absolute = new URL(url, window.location.origin).toString();
          await navigator.clipboard.writeText(absolute);
          setCopied(true);
        } catch {
          // Clipboard unavailable (permissions / insecure context) — no-op.
        }
      }}
      title="Copy invite link"
      className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted transition-colors hover:text-foreground"
    >
      {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

export function InviteTeammatesSection({
  projectId,
  invites,
  members,
  currentUserId,
  isOwner,
}: {
  projectId: string;
  invites: Invite[];
  members: Member[];
  currentUserId: string;
  isOwner: boolean;
}) {
  const [state, formAction, pending] = useActionState(createProjectInvite, undefined);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Invite teammates</h2>
      {isOwner && (
        <form action={formAction} className="glass rounded-xl p-4">
          {state?.error && <p className="mb-3 rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-xs text-danger">{state.error}</p>}
          {state?.inviteUrl && (
            <div className="mb-3 flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary-muted px-3 py-2 text-xs text-accent">
              <span className="min-w-0 truncate">Invite link ready: {state.inviteUrl}</span>
              <CopyLinkButton url={state.inviteUrl} />
            </div>
          )}
          <input type="hidden" name="projectId" value={projectId} />
          <div className="grid gap-3">
            <input name="emailOrUsername" placeholder="email or @username" className={inputClass} />
            <input name="title" required placeholder="Role title, e.g. Product Designer" className={inputClass} />
            <div className="grid grid-cols-2 gap-3">
              <select name="role" defaultValue="MEMBER" className={inputClass}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button disabled={pending} className="rounded-md btn-liquid px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-60">
                {pending ? "Inviting…" : "Create invite"}
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">Email sending is not wired yet: copy invite links manually for now.</p>
        </form>
      )}

      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-semibold">Pending invites</h3>
        <ul className="mt-3 flex flex-col gap-3">
          {invites.map((invite) => {
            const invitePath = `/invite/${invite.token}`;
            const isRecipient = invite.recipientId === currentUserId;
            return (
              <li key={invite.id} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{invite.recipient?.name ?? invite.email ?? "Reusable invite link"}</p>
                    <p className="mt-1 text-xs text-muted">{invite.title} · {invite.role}</p>
                    <p className="mt-2 truncate font-mono text-[11px] text-faint">{invitePath}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    <CopyLinkButton url={invitePath} />
                    {isOwner && (
                      <form action={revokeProjectInvite.bind(null, invite.id)}>
                        <button className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-foreground">Revoke</button>
                      </form>
                    )}
                    {isRecipient && (
                      <>
                        <form action={acceptProjectInvite.bind(null, invite.token)}>
                          <button className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-on-primary">Accept</button>
                        </form>
                        <form action={declineProjectInvite.bind(null, invite.token)}>
                          <button className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-foreground">Decline</button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
          {invites.length === 0 && <li className="text-xs text-faint">No pending invites</li>}
        </ul>
      </div>

      {isOwner && members.length > 1 && (
        <form action={transferProjectOwnership} className="glass rounded-xl p-4">
          <input type="hidden" name="projectId" value={projectId} />
          <h3 className="text-sm font-semibold">Transfer ownership</h3>
          <p className="mt-1 text-xs text-muted">Move project ownership to another member. Your role becomes admin.</p>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <select name="newOwnerId" className={inputClass}>
              {members.filter((m) => m.userId !== currentUserId).map((member) => (
                <option key={member.userId} value={member.userId}>{member.user.name} @{member.user.username}</option>
              ))}
            </select>
            <button className="rounded-md border border-danger/40 px-3 py-2 text-sm text-danger hover:bg-danger-muted">Transfer</button>
          </div>
        </form>
      )}
    </section>
  );
}
