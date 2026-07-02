"use client";

import { useTransition } from "react";
import { Heart, Bookmark, UserPlus, UserCheck, Radio } from "lucide-react";
import {
  toggleLike,
  toggleBookmark,
  toggleFollowUser,
  toggleFollowProject,
} from "@/lib/actions/social";

export function LikeButton({
  entryId,
  liked,
  count,
  path,
}: {
  entryId: string;
  liked: boolean;
  count: number;
  path: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleLike(entryId, path))}
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors ${
        liked ? "text-like" : "text-muted hover:text-like"
      } disabled:opacity-60`}
    >
      <Heart size={15} fill={liked ? "currentColor" : "none"} />
      {count}
    </button>
  );
}

export function BookmarkButton({
  projectId,
  bookmarked,
  path,
}: {
  projectId: string;
  bookmarked: boolean;
  path: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleBookmark(projectId, path))}
      title={bookmarked ? "Remove bookmark" : "Bookmark project"}
      className={`rounded-full p-1.5 transition-colors ${
        bookmarked ? "text-accent" : "text-muted hover:text-accent"
      } disabled:opacity-60`}
    >
      <Bookmark size={15} fill={bookmarked ? "currentColor" : "none"} />
    </button>
  );
}

export function FollowUserButton({
  targetUserId,
  following,
  path,
}: {
  targetUserId: string;
  following: boolean;
  path: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleFollowUser(targetUserId, path))}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
        following
          ? "border border-border bg-glass text-muted hover:text-foreground"
          : "bg-primary text-on-primary hover:bg-primary-hover"
      }`}
    >
      {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
      {following ? "Following" : "Follow"}
    </button>
  );
}

export function FollowProjectButton({
  projectId,
  following,
  path,
}: {
  projectId: string;
  following: boolean;
  path: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleFollowProject(projectId, path))}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
        following
          ? "border border-border bg-glass text-muted hover:text-foreground"
          : "bg-primary text-on-primary hover:bg-primary-hover"
      }`}
    >
      <Radio size={14} />
      {following ? "Following" : "Follow project"}
    </button>
  );
}
