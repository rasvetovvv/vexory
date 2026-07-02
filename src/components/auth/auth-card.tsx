"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type Mode = "signin" | "signup";

export function AuthCard() {
  const [mode, setMode] = useState<Mode>("signin");

  return (
    <div className="flex flex-col gap-6 p-8 md:p-10">
      <div className="mx-auto flex w-full max-w-sm rounded-full border border-border bg-surface p-1">
        <TabButton active={mode === "signin"} onClick={() => setMode("signin")}>
          Sign in
        </TabButton>
        <TabButton active={mode === "signup"} onClick={() => setMode("signup")}>
          Sign up
        </TabButton>
      </div>

      {mode === "signin" ? <SignInForm /> : <SignUpForm />}

      <div className="mx-auto w-full max-w-sm">
        <div className="mb-4 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" />
          or continue with
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <OAuthButton provider="google" label="Google" />
          <OAuthButton provider="github" label="GitHub" />
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary-muted text-accent"
          : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function OAuthButton({ provider, label }: { provider: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => signIn(provider, { callbackUrl: "/feed" })}
      className="rounded-md border border-border bg-glass px-4 py-2.5 text-sm font-medium transition-colors hover:bg-glass-hover"
    >
      {label}
    </button>
  );
}

function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <input
        {...props}
        className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-faint focus:border-border-primary"
      />
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

function SubmitButton({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-1 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-60"
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-xs text-danger">
      {message}
    </p>
  );
}

function SignInForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/feed");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <div className="mb-1 text-center">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Good to see you again on Vexory</p>
      </div>
      <ErrorNote message={error} />
      <Field label="Email" name="email" type="email" placeholder="name@company.com" required />
      <Field label="Password" name="password" type="password" placeholder="••••••••" required />
      <SubmitButton loading={loading}>Sign in</SubmitButton>
    </form>
  );
}

function SignUpForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      username: form.get("username"),
      password: form.get("password"),
    };

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });
    setLoading(false);
    if (signInRes?.error) {
      setError("Account created — please sign in");
    } else {
      router.push("/feed");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <div className="mb-1 text-center">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-muted">Join the community of builders</p>
      </div>
      <ErrorNote message={error} />
      <Field label="Full name" name="name" placeholder="Ivan Petrov" required />
      <Field label="Email" name="email" type="email" placeholder="name@company.com" required />
      <Field
        label="Username"
        name="username"
        placeholder="ivan_petrov"
        hint="This will be your unique Vexory link"
        required
      />
      <Field
        label="Password"
        name="password"
        type="password"
        placeholder="••••••••"
        hint="At least 8 characters, with letters and digits"
        required
      />
      <SubmitButton loading={loading}>Create account</SubmitButton>
    </form>
  );
}
