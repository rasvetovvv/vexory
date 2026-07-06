import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderKanban, Users, Rocket, Radar, Activity } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/feed");
  const [projectCount, builderCount, openRoleCount, updateCount] = await Promise.all([
    prisma.project.count(),
    prisma.user.count(),
    prisma.openRole.count({ where: { status: "OPEN" } }),
    prisma.feedEvent.count(),
  ]);

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
            className="rounded-md btn-liquid px-4 py-2 text-sm font-semibold text-on-primary"
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
          <span className="text-gradient-primary">build together</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
          Not another feed of hot takes. Your profile is your projects: what
          you&apos;re building, who you need, and the real progress behind it.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auth"
            className="rounded-md btn-liquid px-6 py-3 text-sm font-semibold text-on-primary transition-transform duration-100 active:scale-[0.98]"
          >
            Start building
          </Link>
          <Link
            href="/explore"
            className="rounded-md border border-border bg-glass px-6 py-3 text-sm font-semibold transition-all hover:bg-glass-hover active:scale-[0.98]"
          >
            Explore projects
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-3 px-6 pb-16 md:grid-cols-4">
        <LiveMetric label="Projects" value={projectCount} />
        <LiveMetric label="Builders" value={builderCount} />
        <LiveMetric label="Open roles" value={openRoleCount} />
        <LiveMetric label="Build events" value={updateCount} />
      </section>

      {/* Features */}
      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-6 pb-16 sm:grid-cols-2 lg:grid-cols-4">
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

      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <div className="glass-deep overflow-hidden rounded-2xl p-6 md:p-8">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-accent">
            New public explore
          </p>
          <div className="mt-4 grid gap-6 md:grid-cols-[1fr_280px] md:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Browse launches before you sign up
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Public showcase pages now expose team, roadmap, open roles and launch-readiness signals — enough to understand whether a project is real before joining the network.
              </p>
            </div>
            <Link
              href="/explore"
              className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-primary"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted text-accent">
                <Activity size={20} />
              </span>
              <span className="mt-4 block text-sm font-semibold">Open live explorer →</span>
              <span className="mt-1 block text-xs text-muted">Projects, roles, launches and network pulse.</span>
            </Link>
          </div>
        </div>
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

function LiveMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass glass-card-interactive rounded-xl p-4 text-center">
      <p className="font-mono text-2xl font-bold text-accent">{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-faint">{label}</p>
    </div>
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
    <div className="glass glass-card-interactive rounded-xl p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted text-accent">
        {icon}
      </span>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
    </div>
  );
}
