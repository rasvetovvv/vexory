import { Search } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/70 px-4 py-3 backdrop-blur-xl md:px-8">
      <form action="/search" className="relative max-w-md">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          name="q"
          placeholder="Search projects, people…"
          className="w-full rounded-full border border-border bg-surface py-2 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-faint focus:border-border-primary"
        />
      </form>
    </header>
  );
}
