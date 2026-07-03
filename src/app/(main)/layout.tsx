import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { CommandPalette } from "@/components/shell/command-palette";

export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  // Read identity from the DB, not the JWT: name/username/avatar go stale in
  // the token after a profile edit (the jwt callback only runs on sign-in).
  const [user, unreadCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        username: true,
        avatar: true,
        onboardingCompleted: true,
      },
    }),
    prisma.notification.count({
      where: { recipientId: session.user.id, read: false },
    }),
  ]);
  if (!user) redirect("/auth");
  if (!user.onboardingCompleted) redirect("/onboarding");

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-1">
      <Sidebar
        user={{
          name: user.name,
          username: user.username,
          image: user.avatar,
        }}
        unreadCount={unreadCount}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={{
            name: user.name,
            username: user.username,
            image: user.avatar,
          }}
        />
        <main className="flex-1 px-4 pb-24 pt-6 md:px-8 lg:pb-6">
          {children}
        </main>
      </div>
      <MobileNav unreadCount={unreadCount} />
      <CommandPalette />
    </div>
  );
}
