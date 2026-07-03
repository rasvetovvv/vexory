"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderKanban, Plus, Briefcase, Bell } from "lucide-react";

const items = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/projects/new", label: "New", icon: Plus, primary: true },
  { href: "/roles", label: "Roles", icon: Briefcase },
  { href: "/notifications", label: "Alerts", icon: Bell },
];

/*
  Bottom tab bar for < lg viewports, where the sidebar is hidden.
  Search / people / settings stay reachable through the topbar.
*/
export function MobileNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="glass-bar fixed inset-x-0 bottom-0 z-20 border-t border-border pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {items.map(({ href, label, icon: Icon, primary }) => {
          const active =
            href === "/projects/new"
              ? pathname === href
              : pathname === href ||
                (pathname.startsWith(href + "/") && href !== "/projects");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-12 flex-col items-center justify-center gap-0.5 px-1 pb-1.5 pt-2 text-[10px] font-medium transition-colors ${
                  primary
                    ? "text-accent"
                    : active
                      ? "text-foreground"
                      : "text-muted hover:text-foreground"
                }`}
              >
                {primary ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full btn-liquid text-on-primary">
                    <Icon size={14} />
                  </span>
                ) : (
                  <Icon size={18} />
                )}
                {href === "/notifications" && unreadCount > 0 && (
                  <span className="absolute right-1/2 top-1 flex h-4 min-w-4 -translate-x-[-14px] items-center justify-center rounded-full bg-primary px-1 font-mono text-[9px] font-bold text-on-primary">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
                <span
                  className={primary ? "text-muted" : undefined}
                >
                  {label}
                </span>
                {active && !primary && (
                  <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
