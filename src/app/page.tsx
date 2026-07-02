import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderKanban, Users, Rocket, Radar } from "lucide-react";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/feed");

  return (
    <main className="flex flex-1 flex-col">
      {/* Nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-lg font-bold text-on-primary">
            V
          </span>
          <span className="text-lg font-semibold tracking-tight">Vexory</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="rounded-md px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/auth"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 pb-20 pt-16 text-center md:pt-24">
        <p className="rounded-full border border-border bg-glass px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-accent">
          Project-first social network
        </p>
        <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Where builders{" "}
          <span className="text-accent">build together</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
          Not another feed of hot takes. Your profile is your projects: what
          you&apos;re building, who you need, and the real progress behind it.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auth"
            className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
          >
            Start building
          </Link>
          <Link
            href="/auth"
            className="rounded-md border border-border bg-glass px-6 py-3 text-sm font-semibold transition-colors hover:bg-glass-hover"
          >
            Explore projects
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        <Feature
          icon={<FolderKanban size={20} />}
          title="Projects, not posts"
          text="Every project has its own page: build log, roadmap, team and open roles."
        />
        <Feature
          icon={<Users size={20} />}
          title="Find your team"
          text="Open roles with equity, paid or contract terms. Apply in one click."
        />
        <Feature
          icon={<Rocket size={20} />}
          title="Ship in public"
          text="Human-readable commit history. Followers see launches, not noise."
        />
        <Feature
          icon={<Radar size={20} />}
          title="Real progress"
          text="Trending is computed from build velocity, not marketing budgets."
        />
      </section>

      <footer className="border-t border-border px-6 py-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between font-mono text-[11px] uppercase tracking-wider text-faint">
          <span>© 2026 Vexory</span>
          <span>Build in public</span>
        </div>
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="glass rounded-xl p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted text-accent">
        {icon}
      </span>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
    </div>
  );
}
