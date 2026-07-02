import { PagePlaceholder } from "@/components/shell/page-placeholder";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return (
    <PagePlaceholder
      title={`@${username}`}
      description="Profile — roles, currently building, looking for, and an auto-generated portfolio."
    />
  );
}
