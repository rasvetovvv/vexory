import Link from "next/link";
import { ExternalLink, Rocket } from "lucide-react";
import { publicBaseUrl } from "@/lib/urls";

/*
  Once a project reaches MVP_LAUNCHED / LAUNCHED its public showcase page
  doubles as the launch page. This card points there and pre-fills shares
  for the channels builders actually use.
*/
export function LaunchShareCard({
  slug,
  name,
  tagline,
}: {
  slug: string;
  name: string;
  tagline: string;
}) {
  const url = `${publicBaseUrl()}/showcase/${slug}`;
  const text = `${name} has launched — ${tagline}`;
  const shares = [
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ];

  return (
    <section className="glass rounded-xl p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Rocket size={15} className="text-success" />
        Launch page
      </h2>
      <p className="mt-1.5 text-xs text-muted">
        A public page anyone can open without signing in — made for sharing.
      </p>
      <Link
        href={`/showcase/${slug}`}
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
      >
        View launch page <ExternalLink size={13} />
      </Link>
      <div className="mt-3 flex flex-wrap gap-2">
        {shares.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border bg-glass px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground"
          >
            Share on {s.label}
          </a>
        ))}
      </div>
    </section>
  );
}
