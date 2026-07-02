import { Check, CircleDashed, Loader, Trash2 } from "lucide-react";
import {
  addRoadmapItem,
  cycleRoadmapStatus,
  deleteRoadmapItem,
} from "@/lib/actions/projects";

type RoadmapItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
};

export function RoadmapSection({
  projectId,
  items,
  isMember,
}: {
  projectId: string;
  items: RoadmapItem[];
  isMember: boolean;
}) {
  const done = items.filter((i) => i.status === "DONE").length;
  const progress = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Roadmap</h2>
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted">
          {progress}% completed
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-surface-high">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={`glass flex items-start gap-3 rounded-lg p-3.5 ${
              item.status === "IN_PROGRESS" ? "border-border-primary" : ""
            }`}
          >
            {isMember ? (
              <form
                action={async () => {
                  "use server";
                  await cycleRoadmapStatus(item.id);
                }}
              >
                <button
                  type="submit"
                  title="Click to change status"
                  className="mt-0.5 text-muted transition-colors hover:text-accent"
                >
                  <ItemIcon status={item.status} />
                </button>
              </form>
            ) : (
              <span className="mt-0.5 text-muted">
                <ItemIcon status={item.status} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium ${item.status === "DONE" ? "text-muted line-through" : ""}`}
              >
                {item.title}
              </p>
              {item.description && (
                <p className="mt-0.5 text-xs text-muted">{item.description}</p>
              )}
            </div>
            {isMember && (
              <form
                action={async () => {
                  "use server";
                  await deleteRoadmapItem(item.id);
                }}
              >
                <button
                  type="submit"
                  title="Delete"
                  className="text-faint transition-colors hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </form>
            )}
          </li>
        ))}
        {items.length === 0 && (
          <li className="col-span-full rounded-lg border border-dashed border-border p-6 text-center text-sm text-faint">
            No roadmap yet
          </li>
        )}
      </ul>

      {isMember && <AddItemForm projectId={projectId} />}
    </section>
  );
}

function ItemIcon({ status }: { status: string }) {
  if (status === "DONE") return <Check size={16} className="text-success" />;
  if (status === "IN_PROGRESS")
    return <Loader size={16} className="text-accent" />;
  return <CircleDashed size={16} />;
}

function AddItemForm({ projectId }: { projectId: string }) {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";
        await addRoadmapItem(undefined, formData);
      }}
      className="flex gap-2"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input
        name="title"
        required
        minLength={2}
        maxLength={140}
        placeholder="Add roadmap item…"
        className="flex-1 rounded-md border border-border bg-surface px-3.5 py-2 text-sm outline-none placeholder:text-faint focus:border-border-primary"
      />
      <button
        type="submit"
        className="rounded-md border border-border bg-glass px-4 py-2 text-xs font-semibold transition-colors hover:bg-glass-hover"
      >
        Add
      </button>
    </form>
  );
}
