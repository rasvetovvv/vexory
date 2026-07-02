import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthCard } from "@/components/auth/auth-card";

export const metadata = { title: "Sign in" };

export default async function AuthPage() {
  const session = await auth();
  if (session?.user) redirect("/feed");

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center p-4 md:p-8">
      <div className="glass grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-xl lg:grid-cols-[1fr_360px]">
        <AuthCard />
        <aside className="hidden flex-col justify-center gap-8 border-l border-border bg-primary-muted/40 p-10 lg:flex">
          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-2xl font-bold text-on-primary">
              V
            </div>
            <h2 className="text-2xl font-semibold leading-tight">
              Vexory — the network for people building the future
            </h2>
          </div>
          <ul className="flex flex-col gap-5 text-sm">
            <li>
              <p className="font-medium">Projects first</p>
              <p className="text-muted">
                Share ideas, find teammates and build products together
              </p>
            </li>
            <li>
              <p className="font-medium">A community of builders</p>
              <p className="text-muted">
                Founders, developers, designers, investors and experts
              </p>
            </li>
            <li>
              <p className="font-medium">Room to grow</p>
              <p className="text-muted">
                Investment, open roles, collaborations and real connections
              </p>
            </li>
            <li>
              <p className="font-medium">Signal, not noise</p>
              <p className="text-muted">
                Quality networking without memes and filler content
              </p>
            </li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
