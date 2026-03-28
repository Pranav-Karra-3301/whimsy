import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Whimsy — NPCify Everything",
  description: "Scan any object, give it googly eyes and a personality, then talk to it.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans min-h-screen bg-bg text-neutral-200 antialiased">
        <Nav />
        <main className="max-w-2xl mx-auto px-4 pb-20">
          {children}
        </main>
      </body>
    </html>
  );
}
