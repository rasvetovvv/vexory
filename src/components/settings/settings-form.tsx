"use client";

import { useActionState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { updateProfile } from "@/lib/actions/profile";
import { roleLabels } from "@/lib/format";

const inputClass =
  "rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-faint focus:border-border-primary";

type UserData = {
  name: string;
  username: string;
  avatar: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  roles: string[];
  skills: string[];
  openForWork: boolean;
  websiteUrl: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
};

export function SettingsForm({ user }: { user: UserData }) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state?.error && (
        <p className="rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-xs text-danger">
          {state.error}
        </p>
      )}
      {state?.saved && (
        <p className="rounded-md border border-success/30 bg-success-muted px-3 py-2 text-xs text-success">
          Profile saved
        </p>
      )}

      <div className="flex items-center gap-4">
        <Avatar name={user.name} image={user.avatar} size={64} />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Avatar</span>
          <input
            type="file"
            name="avatar"
            accept="image/jpeg,image/png,image/webp"
            className="text-xs text-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-glass file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-foreground"
          />
          <span className="text-xs text-faint">JPEG, PNG or WebP, up to 2 MB</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Full name</span>
          <input name="name" defaultValue={user.name} required minLength={2} maxLength={60} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Username</span>
          <input
            name="username"
            defaultValue={user.username}
            required
            minLength={3}
            maxLength={30}
            pattern="[a-z0-9_]+"
            className={inputClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Headline</span>
        <input
          name="headline"
          defaultValue={user.headline ?? ""}
          maxLength={100}
          placeholder="Founder building Picksy · Backend engineer"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Bio</span>
        <textarea
          name="bio"
          defaultValue={user.bio ?? ""}
          rows={4}
          maxLength={2000}
          placeholder="What are you building? What have you shipped?"
          className={inputClass}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Roles (up to 5)</legend>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {Object.entries(roleLabels).map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs has-checked:border-border-primary has-checked:bg-primary-muted"
            >
              <input
                type="checkbox"
                name="roles"
                value={value}
                defaultChecked={user.roles.includes(value)}
                className="accent-[#7c5cff]"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Skills</span>
        <input
          name="skills"
          defaultValue={user.skills.join(", ")}
          maxLength={300}
          placeholder="react, node, postgres, figma (comma-separated)"
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Location</span>
          <input name="location" defaultValue={user.location ?? ""} maxLength={60} placeholder="Berlin, Remote" className={inputClass} />
        </label>
        <label className="mt-6 flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            name="openForWork"
            defaultChecked={user.openForWork}
            className="h-4 w-4 accent-[#7c5cff]"
          />
          <span className="font-medium">Open for work</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Website</span>
          <input name="websiteUrl" type="url" defaultValue={user.websiteUrl ?? ""} placeholder="https://…" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">GitHub</span>
          <input name="githubUrl" type="url" defaultValue={user.githubUrl ?? ""} placeholder="https://github.com/…" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">X / Twitter</span>
          <input name="twitterUrl" type="url" defaultValue={user.twitterUrl ?? ""} placeholder="https://x.com/…" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">LinkedIn</span>
          <input name="linkedinUrl" type="url" defaultValue={user.linkedinUrl ?? ""} placeholder="https://linkedin.com/in/…" className={inputClass} />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 self-start rounded-md btn-liquid px-5 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
