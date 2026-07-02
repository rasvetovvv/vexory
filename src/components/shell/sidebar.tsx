"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  FolderKanban,
  Search,
  Users,
  Briefcase,
  Bell,
  Bookmark,
  User,
  Plus,
  LogOut,
} from "lucide-react";

const nav = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/people", label: "People", icon: Users },
  { href: "/roles", label: "Open Roles", icon: Briefcase },
  { href: "/search", label: "Search", icon: Search },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
];

export function Sidebar({
  user,
}: {
  user: { name: string; username: string; image: string | null };
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-4 border-r border-border p-4 lg:flex">
      <Link href="/feed" className="flex items-center gap-2.5 px-2 py-1.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-lg font-bold text-on-primary">
          V
        </span>
        <span className="text-lg font-semibold tracking-tight">Vexory</span>
      </Link>

      <Link
        href="/projects/new"
        className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
      >
        <Plus size={16} />
        New project
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-muted text-foreground"
                  : "text-muted hover:bg-glass hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="glass flex items-center gap-3 rounded-lg p-3">
        <Link
          href={`/u/${user.username}`}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-muted text-sm font-semibold text-accent">
              <User size={16} />
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">
              {user.name}
            </span>
            <span className="block truncate text-xs text-muted">
              @{user.username}
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/auth" })}
          title="Sign out"
          className="shrink-0 rounded-md p-2 text-muted transition-colors hover:bg-glass hover:text-foreground"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
