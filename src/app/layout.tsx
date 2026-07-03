import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { LiquidPointer } from "@/components/shell/liquid-pointer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://network.vexory.xyz"),
  title: {
    default: "Vexory — build products together",
    template: "%s · Vexory",
  },
  description:
    "Project-first social network for builders. Share what you're building, find your team, follow real progress.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Vexory",
    url: "https://network.vexory.xyz",
    title: "Vexory — build products together",
    description:
      "Project-first social network for builders. Share what you're building, find your team, follow real progress.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vexory — build products together",
    description:
      "Project-first social network for builders. Share what you're building, find your team, follow real progress.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ambient">
        <LiquidPointer />
        {children}
      </body>
    </html>
  );
}
