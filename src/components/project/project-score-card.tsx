import { getProjectScore, type ProjectScoreInput } from "@/lib/project-score";

export function ProjectScoreCard({ project }: { project: ProjectScoreInput }) {
  const score = getProjectScore(project);

  return (
    <section className="glass rounded-xl p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Launch readiness</h2>
          <p className="mt-1 text-xs text-muted">
            A lightweight signal based on team, shipping cadence, roadmap and traction.
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl font-bold text-accent">{score.score}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-faint">{score.label}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {score.signals.map((signal) => {
          const percent = Math.round((signal.value / signal.max) * 100);
          return (
            <div key={signal.label}>
              <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-faint">
                <span>{signal.label}</span>
                <span>{signal.value}/{signal.max}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-glass">
                <div
                  className="h-full rounded-full bg-accent shadow-[0_0_18px_rgba(124,92,255,0.35)]"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
