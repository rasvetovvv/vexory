import { Check, Minus } from "lucide-react";

/*
  Trust signals computed from what the project actually has connected — not a
  verification checkmark, just facts.
*/

export function VerificationList({
  websiteUrl,
  githubUrl,
  demoUrl,
}: {
  websiteUrl: string | null;
  githubUrl: string | null;
  demoUrl: string | null;
}) {
  const items = [
    { label: "Website connected", ok: !!websiteUrl, href: websiteUrl },
    { label: "GitHub connected", ok: !!githubUrl, href: githubUrl },
    { label: "Demo available", ok: !!demoUrl, href: demoUrl },
  ];

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2.5 text-sm">
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              item.ok ? "bg-success-muted text-success" : "bg-surface-raised text-faint"
            }`}
          >
            {item.ok ? <Check size={12} strokeWidth={3} /> : <Minus size={12} />}
          </span>
          {item.ok && item.href ? (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-accent"
            >
              {item.label}
            </a>
          ) : (
            <span className={item.ok ? "" : "text-faint"}>{item.label}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
