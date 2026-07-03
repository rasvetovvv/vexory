"use client";

import { useActionState } from "react";
import { completeOnboarding, skipOnboarding } from "@/lib/actions/onboarding";

const roles = [
  ["FOUNDER", "Founder"],
  ["DEVELOPER", "Developer"],
  ["DESIGNER", "Designer"],
  ["PRODUCT_MANAGER", "Product"],
  ["AI_ENGINEER", "AI Engineer"],
  ["MARKETER", "Marketer"],
  ["INVESTOR", "Investor"],
  ["DEVOPS", "DevOps"],
] as const;

const inputClass =
  "rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-faint focus:border-border-primary";

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(completeOnboarding, undefined);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_360px]">
      <section className="glass-deep rounded-xl p-6 md:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Step 1 / Builder signal</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Tell Vexory what you build around</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          This makes the first feed useful: suggested builders, relevant projects, open roles and launch signals.
        </p>

        <form action={formAction} className="mt-8 flex flex-col gap-6">
          {state?.error && (
            <p className="rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-xs text-danger">
              {state.error}
            </p>
          )}

          <div>
            <h2 className="text-sm font-semibold">Choose your roles</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              {roles.map(([value, label]) => (
                <label key={value} className="cursor-pointer rounded-lg border border-border bg-glass p-3 text-sm transition-colors hover:border-border-primary has-[:checked]:border-primary has-[:checked]:bg-primary-muted has-[:checked]:text-accent">
                  <input type="checkbox" name="roles" value={value} className="sr-only" />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Headline</span>
            <input name="headline" maxLength={120} placeholder="Founder building AI tools for creators" className={inputClass} />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Skills</span>
            <input name="skills" maxLength={300} placeholder="react, ai, product, growth" className={inputClass} />
            <span className="text-xs text-muted">Comma-separated. Used for recommendations and open roles.</span>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Interests</span>
            <input name="interests" maxLength={300} placeholder="saas, developer tools, consumer ai, fintech" className={inputClass} />
          </label>

          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="openForWork" className="h-4 w-4 accent-[var(--accent)]" />
            I am open to joining projects and collaborations
          </label>

          <div className="flex flex-wrap gap-3">
            <button disabled={pending} className="rounded-md btn-liquid px-5 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60">
              {pending ? "Saving…" : "Continue to first project"}
            </button>
            <button formAction={skipOnboarding} className="rounded-md border border-border bg-glass px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-foreground">
              Skip for now
            </button>
          </div>
        </form>
      </section>

      <aside className="flex flex-col gap-4">
        {[
          ["1", "Roles", "Founder, developer, designer or investor signal."],
          ["2", "Skills", "Used to match projects and teammates."],
          ["3", "First project", "After this step we send you to project creation."],
          ["4", "Interests", "Feed tabs and recommendations become relevant."],
          ["5", "Recommendations", "Follow people/projects to activate your discover feed."],
        ].map(([n, title, text]) => (
          <div key={n} className="glass rounded-xl p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-muted font-mono text-xs text-accent">{n}</span>
              <div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">{text}</p>
              </div>
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
}
