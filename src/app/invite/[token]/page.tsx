import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { acceptProjectInvite, declineProjectInvite } from "@/lib/actions/projects";

export const metadata = { title: "Project invite" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/auth?callbackUrl=/invite/${token}`);

  const invite = await prisma.projectInvite.findUnique({
    where: { token },
    include: {
      project: { select: { name: true, slug: true, tagline: true } },
      sender: { select: { name: true, username: true } },
      recipient: { select: { id: true, name: true, username: true } },
    },
  });
  if (!invite) notFound();

  const blocked = invite.recipientId && invite.recipientId !== session.user.id;
  const expired = invite.expiresAt ? invite.expiresAt < new Date() : false;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="glass-deep w-full max-w-xl rounded-xl p-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Project invite</p>
        <h1 className="mt-3 text-3xl font-semibold">Join {invite.project.name}</h1>
        <p className="mt-2 text-sm text-muted">{invite.project.tagline}</p>
        <div className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm">
          <p><span className="text-muted">Invited by:</span> {invite.sender.name} @{invite.sender.username}</p>
          <p className="mt-2"><span className="text-muted">Role:</span> {invite.title} · {invite.role}</p>
          <p className="mt-2"><span className="text-muted">Status:</span> {invite.status}</p>
        </div>

        {blocked || expired || invite.status !== "PENDING" ? (
          <p className="mt-6 rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-sm text-danger">
            {blocked ? "This invite is assigned to another user." : expired ? "This invite has expired." : "This invite is no longer pending."}
          </p>
        ) : (
          <div className="mt-6 flex gap-3">
            <form action={acceptProjectInvite.bind(null, token)}>
              <button className="rounded-md btn-liquid px-5 py-2.5 text-sm font-semibold text-on-primary">Accept invite</button>
            </form>
            <form action={declineProjectInvite.bind(null, token)}>
              <button className="rounded-md border border-border bg-glass px-5 py-2.5 text-sm font-semibold text-muted hover:text-foreground">Decline</button>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}
