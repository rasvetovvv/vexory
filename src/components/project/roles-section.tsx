import { X } from "lucide-react";
import { CompensationBadge } from "@/components/ui/badges";
import { openRole, closeRole, applyToRole } from "@/lib/actions/projects";
import { compensationLabels } from "@/lib/format";

type Role = {
  id: string;
  title: string;
  description: string | null;
  compensation: string;
  hoursPerWeek: number | null;
  applications: { userId: string }[];
};

export function RolesSection({
  projectId,
  roles,
  isMember,
  currentUserId,
}: {
  projectId: string;
  roles: Role[];
  isMember: boolean;
  currentUserId: string;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Open Roles</h2>
      <ul className="flex flex-col gap-3">
        {roles.map((role) => {
          const applied = role.applications.some((a) => a.userId === currentUserId);
          return (
            <li key={role.id} className="glass rounded-lg p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-bold">{role.title}</p>
                  {role.description && (
                    <p className="mt-1 text-xs text-muted">{role.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <CompensationBadge compensation={role.compensation} />
                    {role.hoursPerWeek && (
                      <span className="text-xs text-muted">
                        ~{role.hoursPerWeek}h / week
                      </span>
                    )}
                  </div>
                </div>
                {isMember && (
                  <form
                    action={async () => {
                      "use server";
                      await closeRole(role.id);
                    }}
                  >
                    <button
                      type="submit"
                      title="Close role"
                      className="text-faint transition-colors hover:text-danger"
                    >
                      <X size={15} />
                    </button>
                  </form>
                )}
              </div>
              {!isMember && (
                <div className="mt-3">
                  {applied ? (
                    <p className="text-xs font-semibold text-success">
                      ✓ Application sent
                    </p>
                  ) : (
                    <form
                      action={async (formData: FormData) => {
                        "use server";
                        await applyToRole(undefined, formData);
                      }}
                      className="flex gap-2"
                    >
                      <input type="hidden" name="roleId" value={role.id} />
                      <input
                        name="message"
                        maxLength={1000}
                        placeholder="Short intro (optional)"
                        className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-xs outline-none placeholder:text-faint focus:border-border-primary"
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-hover"
                      >
                        Apply
                      </button>
                    </form>
                  )}
                </div>
              )}
            </li>
          );
        })}
        {roles.length === 0 && (
          <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-faint">
            No open roles
          </li>
        )}
      </ul>

      {isMember && <AddRoleForm projectId={projectId} />}
    </section>
  );
}

function AddRoleForm({ projectId }: { projectId: string }) {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";
        await openRole(undefined, formData);
      }}
      className="glass flex flex-col gap-2 rounded-lg p-3"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input
        name="title"
        required
        minLength={2}
        maxLength={80}
        placeholder="Role title, e.g. React Developer"
        className="rounded-md border border-border bg-surface px-3 py-2 text-xs outline-none placeholder:text-faint focus:border-border-primary"
      />
      <div className="flex gap-2">
        <select
          name="compensation"
          defaultValue="EQUITY"
          className="rounded-md border border-border bg-surface px-2.5 py-2 text-xs outline-none focus:border-border-primary"
        >
          {Object.entries(compensationLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          name="hoursPerWeek"
          type="number"
          min={1}
          max={80}
          placeholder="h/week"
          className="w-24 rounded-md border border-border bg-surface px-3 py-2 text-xs outline-none placeholder:text-faint focus:border-border-primary"
        />
        <button
          type="submit"
          className="flex-1 rounded-md border border-border bg-glass px-3 py-2 text-xs font-semibold transition-colors hover:bg-glass-hover"
        >
          Open role
        </button>
      </div>
    </form>
  );
}
