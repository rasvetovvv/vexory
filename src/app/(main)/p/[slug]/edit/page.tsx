import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  DeleteProjectForm,
  EditProjectForm,
} from "@/components/project/edit-project-form";

export const metadata = { title: "Edit project" };

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const project = await prisma.project.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      tagline: true,
      description: true,
      websiteUrl: true,
      githubUrl: true,
      demoUrl: true,
      tags: true,
      openTo: true,
      notesWhy: true,
      notesProblem: true,
      notesLearned: true,
      ownerId: true,
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
  });
  if (!project) notFound();

  const membership = project.members[0];
  const canEdit = membership && ["OWNER", "ADMIN"].includes(membership.role);
  if (!canEdit) redirect(`/p/${slug}`);
  const isOwner = project.ownerId === session.user.id;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href={`/p/${slug}`}
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} />
          Back to project
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Edit {project.name}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Status is changed from the project page; team and roles have their
          own sections there.
        </p>
      </div>

      <div className="glass rounded-xl p-6 md:p-8">
        <EditProjectForm project={project} />
      </div>

      {isOwner && (
        <DeleteProjectForm projectId={project.id} projectName={project.name} />
      )}
    </div>
  );
}
