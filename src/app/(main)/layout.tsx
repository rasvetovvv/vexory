import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect("/auth");

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-1">
      <Sidebar
        user={{
          name: session.user.name ?? "Builder",
          username: session.user.username ?? "",
          image: session.user.image ?? null,
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
