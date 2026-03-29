import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Whimsy — Talk to Any Picture",
  description:
    "Upload any photo, painting, or memory and have a voice conversation with it.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans min-h-screen bg-bg antialiased">
        <Nav />
        <main className="max-w-2xl mx-auto px-6 pb-32">{children}</main>
      </body>
    </html>
  );
}
