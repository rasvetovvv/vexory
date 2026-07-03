"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SendHorizontal, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { sendChatMessage, deleteChatMessage } from "@/lib/actions/chat";
import { timeAgo } from "@/lib/format";

export type ChatMessageData = {
  id: string;
  body: string;
  authorId: string;
  createdAt: Date;
  author: { name: string; username: string; avatar: string | null };
};

const POLL_INTERVAL_MS = 5000;

function DeleteMessageButton({ messageId }: { messageId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      title="Delete message"
      onClick={() => startTransition(() => deleteChatMessage(messageId))}
      className="invisible rounded-md p-1 text-faint transition-colors hover:text-danger group-hover:visible disabled:opacity-60"
    >
      <Trash2 size={13} />
    </button>
  );
}

export function ChatRoom({
  projectId,
  messages,
  currentUserId,
  canModerate,
}: {
  projectId: string;
  messages: ChatMessageData[];
  currentUserId: string;
  canModerate: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(sendChatMessage, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wasPending = useRef(false);
  const lastMessageId = messages[messages.length - 1]?.id;

  // Poll for new messages while the tab is visible.
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [router]);

  // Keep the newest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lastMessageId]);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <div className="glass flex min-h-0 flex-1 flex-col rounded-xl">
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-5"
      >
        {messages.map((message, i) => {
          const prev = messages[i - 1];
          const sameAuthorRun =
            prev &&
            prev.authorId === message.authorId &&
            message.createdAt.getTime() - prev.createdAt.getTime() < 5 * 60 * 1000;
          const own = message.authorId === currentUserId;
          return (
            <div
              key={message.id}
              className={`group flex items-start gap-3 ${sameAuthorRun ? "-mt-3" : ""}`}
            >
              <span className="w-7 shrink-0">
                {!sameAuthorRun && (
                  <Link href={`/u/${message.author.username}`}>
                    <Avatar
                      name={message.author.name}
                      image={message.author.avatar}
                      size={28}
                    />
                  </Link>
                )}
              </span>
              <div className="min-w-0 flex-1">
                {!sameAuthorRun && (
                  <p className="flex items-baseline gap-2">
                    <Link
                      href={`/u/${message.author.username}`}
                      className={`text-sm font-semibold hover:text-accent ${own ? "text-accent" : ""}`}
                    >
                      {message.author.name}
                    </Link>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
                      {timeAgo(message.createdAt)}
                    </span>
                  </p>
                )}
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 whitespace-pre-line break-words text-sm leading-relaxed text-foreground/90">
                    {message.body}
                  </p>
                  {(own || canModerate) && (
                    <DeleteMessageButton messageId={message.id} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="rounded-lg border border-dashed border-border px-8 py-6 text-center text-sm text-faint">
              No messages yet — say hi to the team
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-border p-3 md:p-4">
        {state?.error && (
          <p className="mb-2 text-xs text-danger">{state.error}</p>
        )}
        <form ref={formRef} action={formAction} className="flex gap-2">
          <input type="hidden" name="projectId" value={projectId} />
          <input
            name="body"
            required
            maxLength={2000}
            autoComplete="off"
            placeholder="Message the team…"
            className="min-w-0 flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-faint focus:border-border-primary"
          />
          <button
            type="submit"
            disabled={pending}
            title="Send"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full btn-liquid text-on-primary disabled:opacity-60"
          >
            <SendHorizontal size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
