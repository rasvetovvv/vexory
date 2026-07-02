export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="max-w-lg text-sm text-muted">{description}</p>
      <div className="glass mt-6 flex h-48 items-center justify-center rounded-lg text-sm text-faint">
        Coming soon
      </div>
    </div>
  );
}
