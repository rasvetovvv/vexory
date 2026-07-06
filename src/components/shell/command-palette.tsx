"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Bookmark,
  Briefcase,
  FolderKanban,
  Home,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

const OPEN_EVENT = "vexory:open-palette";

/** Anything (topbar, empty states) can open the palette without prop drilling. */
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** Topbar search field — looks like an input, opens the palette. */
export function SearchTrigger() {
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      className="flex w-full max-w-md items-center gap-2.5 rounded-full border border-border bg-surface/40 hover:bg-surface/80 py-2 pl-3.5 pr-3 text-sm text-faint transition-all duration-200 hover:border-border-primary hover:shadow-[0_0_12px_rgba(124,92,255,0.08)] active:scale-[0.98]"
    >
      <Search size={16} className="shrink-0 text-muted" />
      <span className="flex-1 truncate text-left">
        Search projects, people…
      </span>
      <kbd className="hidden shrink-0 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] font-bold text-faint sm:inline">
        Ctrl K
      </kbd>
    </button>
  );
}

type PaletteResults = {
  projects: {
    id: string;
    name: string;
    slug: string;
    tagline: string;
    status: string;
  }[];
  people: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    headline: string | null;
  }[];
  roles: { id: string; title: string; project: { name: string; slug: string } }[];
};

const EMPTY_RESULTS: PaletteResults = { projects: [], people: [], roles: [] };

const quickNav = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/projects/new", label: "New project", icon: Plus },
  { href: "/people", label: "People", icon: Users },
  { href: "/matches", label: "Matches", icon: Sparkles },
  { href: "/roles", label: "Open roles", icon: Briefcase },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
];

type Item = {
  key: string;
  href: string;
  group: "nav" | "projects" | "people" | "roles" | "search";
  render: React.ReactNode;
};

export function CommandPalette() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PaletteResults>(EMPTY_RESULTS);
  const [active, setActive] = useState(0);
  const [searching, setSearching] = useState(false);

  const open = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      setQuery("");
      setResults(EMPTY_RESULTS);
      setActive(0);
    }
  }, []);

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  // Ctrl/⌘+K anywhere; custom event from the topbar trigger.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialogRef.current?.open) close();
        else open();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, open);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, open);
    };
  }, [open, close]);

  // Debounced search, driven by the change handler (not an effect).
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const onQueryChange = useCallback((value: string) => {
    setQuery(value);
    setActive(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    controllerRef.current?.abort();
    const q = value.trim();
    if (q.length < 2) {
      setResults(EMPTY_RESULTS);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    controllerRef.current = controller;
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/palette?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          setResults((await res.json()) as PaletteResults);
          setActive(0);
        }
      } catch {
        // aborted or offline — keep previous results
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 180);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      controllerRef.current?.abort();
    };
  }, []);

  const items = useMemo<Item[]>(() => {
    const q = query.trim();
    if (q.length < 2) {
      const lowered = q.toLowerCase();
      return quickNav
        .filter((n) => !lowered || n.label.toLowerCase().includes(lowered))
        .map(({ href, label, icon: Icon }) => ({
          key: `nav-${href}`,
          href,
          group: "nav" as const,
          render: (
            <>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-muted text-accent">
                <Icon size={15} />
              </span>
              <span className="text-sm font-medium">{label}</span>
            </>
          ),
        }));
    }
    const list: Item[] = [];
    for (const p of results.projects) {
      list.push({
        key: `project-${p.id}`,
        href: `/p/${p.slug}`,
        group: "projects",
        render: (
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-muted text-sm font-bold text-accent">
              {p.name[0]?.toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {p.name}
              </span>
              <span className="block truncate text-xs text-muted">
                {p.tagline}
              </span>
            </span>
          </>
        ),
      });
    }
    for (const u of results.people) {
      list.push({
        key: `person-${u.id}`,
        href: `/u/${u.username}`,
        group: "people",
        render: (
          <>
            <Avatar name={u.name} image={u.avatar} size={32} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {u.name}
              </span>
              <span className="block truncate text-xs text-muted">
                {u.headline ?? `@${u.username}`}
              </span>
            </span>
          </>
        ),
      });
    }
    for (const r of results.roles) {
      list.push({
        key: `role-${r.id}`,
        href: `/p/${r.project.slug}`,
        group: "roles",
        render: (
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-muted text-accent">
              <Briefcase size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-mono text-sm font-bold">
                {r.title}
              </span>
              <span className="block truncate text-xs text-muted">
                at {r.project.name}
              </span>
            </span>
          </>
        ),
      });
    }
    list.push({
      key: "search-all",
      href: `/search?q=${encodeURIComponent(q)}`,
      group: "search",
      render: (
        <>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-muted text-accent">
            <Search size={15} />
          </span>
          <span className="text-sm font-medium">
            Search everywhere for &ldquo;{q}&rdquo;
          </span>
        </>
      ),
    });
    return list;
  }, [query, results]);

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[active];
      if (item) go(item.href);
    }
  }

  // Keep the active row visible while arrowing through the list.
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const groupLabels: Record<Item["group"], string | null> = {
    nav: query.trim().length < 2 ? "Go to" : null,
    projects: "Projects",
    people: "People",
    roles: "Open roles",
    search: null,
  };

  return (
    <dialog
      ref={dialogRef}
      className="palette m-0 w-full max-w-lg bg-transparent p-4 backdrop:bg-black/60 sm:mx-auto sm:mt-[12vh]"
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself) closes.
        if (e.target === dialogRef.current) close();
      }}
    >
      <div className="glass-deep palette-panel overflow-hidden rounded-xl">
        <div className="relative z-10 flex items-center gap-2.5 border-b border-border px-4">
          <Search size={16} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search projects, people, roles…"
            className="w-full border-none bg-transparent py-3.5 text-sm outline-none placeholder:text-faint"
            style={{ boxShadow: "none" }}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={items[active] ? `palette-item-${active}` : undefined}
          />
          {searching && (
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-faint">
              searching…
            </span>
          )}
          <button
            type="button"
            onClick={close}
            className="shrink-0 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] font-bold text-faint transition-colors hover:text-foreground"
          >
            Esc
          </button>
        </div>

        <ul
          id="palette-list"
          ref={listRef}
          role="listbox"
          className="relative z-10 max-h-[50vh] overflow-y-auto p-2"
        >
          {items.map((item, i) => {
            const prev = items[i - 1];
            const label =
              (!prev || prev.group !== item.group) && groupLabels[item.group];
            return (
              <li key={item.key}>
                {label && (
                  <div className="px-2.5 pb-1 pt-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-faint">
                    {label}
                  </div>
                )}
                <button
                  type="button"
                  id={`palette-item-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={i === active}
                  onClick={() => go(item.href)}
                  onMouseMove={() => setActive(i)}
                  className={`flex w-full items-center gap-3 rounded-r-md py-2 pr-2.5 text-left transition-all duration-150 border-l-2 ${
                    i === active
                      ? "bg-primary-muted border-primary pl-2.5 text-foreground"
                      : "border-transparent pl-2.5 text-muted hover:text-foreground"
                  }`}
                >
                  {item.render}
                </button>
              </li>
            );
          })}
          {items.length === 0 && (
            <li className="px-2.5 py-8 text-center text-sm text-faint">
              {searching ? "Searching…" : "Nothing found"}
            </li>
          )}
        </ul>
      </div>
    </dialog>
  );
}
