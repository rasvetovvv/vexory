import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      name: true,
      username: true,
      avatar: true,
      headline: true,
      bio: true,
      location: true,
      roles: true,
      skills: true,
      openForWork: true,
      websiteUrl: true,
      githubUrl: true,
      twitterUrl: true,
      linkedinUrl: true,
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted">
        Your profile is how other builders discover you.
      </p>
      <div className="glass mt-6 rounded-xl p-6 md:p-8">
        <SettingsForm user={user} />
      </div>
    </div>
  );
}
