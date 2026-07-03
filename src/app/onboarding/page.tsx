import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export const metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true },
  });
  if (user?.onboardingCompleted) redirect("/feed");

  return (
    <main className="flex min-h-screen items-center px-4 py-10 md:px-8">
      <OnboardingForm />
    </main>
  );
}
