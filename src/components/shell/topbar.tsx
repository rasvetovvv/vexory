import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { SearchTrigger } from "@/components/shell/command-palette";

export function Topbar({
  user,
}: {
  user?: { name: string; username: string; image: string | null };
}) {
  return (
    <header className="glass-bar sticky top-0 z-10 px-4 py-3 md:px-8">
      <div className="flex items-center gap-3">
        <Link
          href="/feed"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-on-primary lg:hidden"
        >
          V
        </Link>
        <div className="max-w-md flex-1">
          <SearchTrigger />
        </div>
        <Link
          href="/matches"
          className="hidden items-center gap-1.5 rounded-full border border-border bg-glass px-3 py-2 text-xs font-semibold text-muted transition-colors hover:text-accent sm:flex"
        >
          <Sparkles size={14} />
          Matches
        </Link>
        {user && (
          <Link
            href={`/u/${user.username}`}
            title={`@${user.username}`}
            className="shrink-0 lg:hidden"
          >
            <Avatar name={user.name} image={user.image} size={32} />
          </Link>
        )}
      </div>
    </header>
  );
}
