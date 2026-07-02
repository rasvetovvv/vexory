import Link from "next/link";
import { Check, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { acceptApplication, rejectApplication } from "@/lib/actions/projects";
import { timeAgo } from "@/lib/format";

type ApplicationData = {
  id: string;
  message: string | null;
  createdAt: Date;
  user: { name: string; username: string; avatar: string | null; headline: string | null };
  role: { title: string };
};

export function ApplicationsSection({
  applications,
}: {
  applications: ApplicationData[];
}) {
  if (applications.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">
        Applications{" "}
        <span className="font-mono text-xs font-bold text-accent">
          {applications.length}
        </span>
      </h2>
      <ul className="flex flex-col gap-3">
        {applications.map((a) => (
          <li key={a.id} className="glass rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/u/${a.user.username}`} className="flex min-w-0 items-center gap-3">
                <Avatar name={a.user.name} image={a.user.avatar} size={36} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {a.user.name}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {a.user.headline ?? `@${a.user.username}`}
                  </span>
                </span>
              </Link>
              <div className="flex shrink-0 gap-1.5">
                <form
                  action={async () => {
                    "use server";
                    await acceptApplication(a.id);
                  }}
                >
                  <button
                    type="submit"
                    title="Accept — adds to the team"
                    className="rounded-md bg-success-muted p-2 text-success transition-colors hover:bg-success/20"
                  >
                    <Check size={15} />
                  </button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await rejectApplication(a.id);
                  }}
                >
                  <button
                    type="submit"
                    title="Reject"
                    className="rounded-md bg-danger-muted p-2 text-danger transition-colors hover:bg-danger/20"
                  >
                    <X size={15} />
                  </button>
                </form>
              </div>
            </div>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-faint">
              applying for {a.role.title} · {timeAgo(a.createdAt)}
            </p>
            {a.message && <p className="mt-1.5 text-sm text-muted">{a.message}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
