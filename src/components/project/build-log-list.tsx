import Link from "next/link";
import { Link2, Rocket, Flag, DollarSign, Wrench, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { LikeButton } from "@/components/social/action-buttons";
import { CommentBlock } from "@/components/social/comment-block";
import { deleteBuildLogEntry } from "@/lib/actions/projects";
import { timeAgo } from "@/lib/format";

export type BuildLogEntryData = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  proofUrls: string[];
  createdAt: Date;
  authorId: string;
  author: { name: string; username: string; avatar: string | null };
  likes: { userId: string }[];
  comments: {
    id: string;
    body: string;
    userId: string;
    createdAt: Date;
    user: { name: string; username: string; avatar: string | null };
  }[];
};

const typeIcons: Record<string, React.ReactNode> = {
  UPDATE: <Wrench size={13} />,
  MILESTONE: <Flag size={13} />,
  LAUNCH: <Rocket size={13} />,
  FUNDING: <DollarSign size={13} />,
};

const typeStyles: Record<string, string> = {
  UPDATE: "text-muted",
  MILESTONE: "text-accent",
  LAUNCH: "text-success",
  FUNDING: "text-warning",
};

export function BuildLogList({
  entries,
  currentUserId,
  canModerate = false,
  path,
}: {
  entries: BuildLogEntryData[];
  currentUserId: string;
  canModerate?: boolean;
  path: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-faint">
        No updates yet
      </div>
    );
  }
  return (
    <ul className="flex flex-col">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="border-b border-border py-4 first:pt-0 last:border-0"
        >
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-faint">
            <span className={`flex items-center gap-1 ${typeStyles[entry.type] ?? ""}`}>
              {typeIcons[entry.type]}
              {entry.type}
            </span>
            · {timeAgo(entry.createdAt)} ·
            <Link
              href={`/u/${entry.author.username}`}
              className="flex items-center gap-1.5 normal-case tracking-normal text-muted hover:text-foreground"
            >
              <Avatar name={entry.author.name} image={entry.author.avatar} size={16} />
              {entry.author.name}
            </Link>
            {(entry.authorId === currentUserId || canModerate) && (
              <form
                action={deleteBuildLogEntry.bind(null, entry.id)}
                className="ml-auto"
              >
                <button
                  type="submit"
                  title="Delete update"
                  className="rounded-md p-1 text-faint transition-colors hover:text-danger"
                >
                  <Trash2 size={13} />
                </button>
              </form>
            )}
          </div>
          <p className="mt-1.5 text-sm font-medium">{entry.title}</p>
          {entry.body && <p className="mt-1 text-sm text-muted">{entry.body}</p>}
          {entry.proofUrls.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {entry.proofUrls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex max-w-full items-center gap-1 rounded-full border border-border bg-glass px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-accent transition-colors hover:border-border-primary"
                >
                  <Link2 size={11} className="shrink-0" />
                  <span className="truncate normal-case tracking-normal">
                    {new URL(url).hostname.replace(/^www\./, "")}
                  </span>
                </a>
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center gap-2">
            <LikeButton
              entryId={entry.id}
              liked={entry.likes.some((l) => l.userId === currentUserId)}
              count={entry.likes.length}
              path={path}
            />
            <CommentBlock
              targetKind="entry"
              targetId={entry.id}
              comments={entry.comments}
              currentUserId={currentUserId}
              canModerate={canModerate}
              path={path}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
