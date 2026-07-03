"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { CommentBlock } from "@/components/social/comment-block";
import { deletePost, togglePostLike } from "@/lib/actions/social";
import { timeAgo } from "@/lib/format";

export type PostData = {
  id: string;
  body: string;
  createdAt: Date;
  authorId: string;
  author: {
    name: string;
    username: string;
    avatar: string | null;
    headline: string | null;
  };
  project?: { name: string; slug: string } | null;
  likes: { userId: string }[];
  comments: {
    id: string;
    body: string;
    userId: string;
    createdAt: Date;
    user: { name: string; username: string; avatar: string | null };
  }[];
};

function PostLikeButton({
  postId,
  liked,
  count,
  path,
}: {
  postId: string;
  liked: boolean;
  count: number;
  path: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => togglePostLike(postId, path))}
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors ${
        liked ? "text-like" : "text-muted hover:text-like"
      } disabled:opacity-60`}
    >
      <Heart size={15} fill={liked ? "currentColor" : "none"} />
      {count}
    </button>
  );
}

function DeletePostButton({ postId, path }: { postId: string; path: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      title="Delete post"
      onClick={() => {
        if (window.confirm("Delete this post?")) {
          startTransition(() => deletePost(postId, path));
        }
      }}
      className="rounded-md p-1.5 text-faint transition-colors hover:text-danger disabled:opacity-60"
    >
      <Trash2 size={14} />
    </button>
  );
}

export function PostCard({
  post,
  currentUserId,
  path,
}: {
  post: PostData;
  currentUserId: string;
  path: string;
}) {
  return (
    <article className="glass rounded-xl p-5 transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_8px_24px_rgba(0,0,0,0.4)]">
      <div className="flex items-start gap-3">
        <Link href={`/u/${post.author.username}`}>
          <Avatar name={post.author.name} image={post.author.avatar} size={40} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 text-sm">
              <Link
                href={`/u/${post.author.username}`}
                className="font-semibold hover:text-accent"
              >
                {post.author.name}
              </Link>{" "}
              <span className="text-muted">@{post.author.username}</span>
              {post.project && (
                <>
                  {" "}
                  <span className="text-faint">·</span>{" "}
                  <Link
                    href={`/p/${post.project.slug}`}
                    className="font-medium text-accent hover:underline"
                  >
                    {post.project.name}
                  </Link>
                </>
              )}
            </p>
            {post.authorId === currentUserId && (
              <DeletePostButton postId={post.id} path={path} />
            )}
          </div>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-faint">
            {timeAgo(post.createdAt)}
            {post.author.headline ? (
              <span className="normal-case tracking-normal">
                {" "}
                · {post.author.headline}
              </span>
            ) : null}
          </p>

          <p className="mt-2.5 whitespace-pre-line break-words text-sm leading-relaxed">
            {post.body}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <PostLikeButton
              postId={post.id}
              liked={post.likes.some((l) => l.userId === currentUserId)}
              count={post.likes.length}
              path={path}
            />
            <CommentBlock
              targetKind="post"
              targetId={post.id}
              comments={post.comments}
              currentUserId={currentUserId}
              canModerate={post.authorId === currentUserId}
              path={path}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
