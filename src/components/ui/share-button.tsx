"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Share2 } from "lucide-react";

/*
  Share a page: native share sheet where available (mobile), otherwise copy
  the URL and confirm inline. `path` is app-relative so server components can
  render this without knowing the deploy origin.
*/
export function ShareButton({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user dismissed the sheet — fall through to copy? No: dismissal
        // means "never mind", not "copy instead".
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — nothing sensible to do silently
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      title="Share"
      className={`flex items-center gap-1.5 rounded-md border border-border bg-glass px-3 py-1.5 text-xs font-semibold transition-colors ${
        copied ? "text-success" : "text-muted hover:text-foreground"
      }`}
    >
      {copied ? <Check size={13} /> : <Share2 size={13} />}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
