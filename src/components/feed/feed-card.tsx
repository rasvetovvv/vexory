import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/format";

type FeedEventData = {
  id: string;
  type: string;
  payload: unknown;
  createdAt: Date;
  actor: { name: string; username: string; avatar: string | null };
  project: { name: string; slug: string; tagline: string };
};

const verbs: Record<string, string> = {
  PROJECT_CREATED: "started a new project",
  BUILD_LOG_POSTED: "posted an update on",
  STATUS_CHANGED: "changed the status of",
  MVP_LAUNCHED: "launched",
  ROLE_OPENED: "is looking for someone to join",
  MEMBER_JOINED: "joined",
  FUNDING_RAISED: "raised funding for",
};

export function FeedCard({ event }: { event: FeedEventData }) {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const detail =
    typeof payload.title === "string"
      ? payload.title
      : typeof payload.role === "string"
        ? `Role: ${payload.role}`
        : typeof payload.status === "string"
          ? `New status: ${String(payload.status).replace("_", " ")}`
          : null;

  return (
    <article className="glass rounded-xl p-5 transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_8px_24px_rgba(0,0,0,0.4)]">
      <div className="flex items-start gap-3">
        <Link href={`/u/${event.actor.username}`}>
          <Avatar name={event.actor.name} image={event.actor.avatar} size={40} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <Link
              href={`/u/${event.actor.username}`}
              className="font-semibold hover:text-accent"
            >
              {event.actor.name}
            </Link>{" "}
            <span className="text-muted">{verbs[event.type] ?? "updated"}</span>{" "}
            <Link
              href={`/p/${event.project.slug}`}
              className="font-semibold text-accent hover:underline"
            >
              {event.project.name}
            </Link>
          </p>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-faint">
            {timeAgo(event.createdAt)}
          </p>

          {detail && <p className="mt-2 text-sm">{detail}</p>}

          <Link
            href={`/p/${event.project.slug}`}
            className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-border-primary"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-sm font-bold text-accent">
              {event.project.name[0]?.toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {event.project.name}
              </span>
              <span className="block truncate text-xs text-muted">
                {event.project.tagline}
              </span>
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
