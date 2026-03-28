import Link from "next/link";

export function Nav() {
  return (
    <nav className="border-b border-border px-4 py-3 mb-8">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-mono text-lg font-bold text-accent hover:opacity-80 transition-opacity">
          whimsy
        </Link>
        <div className="flex gap-4 text-sm font-mono">
          <Link href="/" className="text-muted hover:text-neutral-200 transition-colors">
            scan
          </Link>
          <Link href="/gallery" className="text-muted hover:text-neutral-200 transition-colors">
            gallery
          </Link>
        </div>
      </div>
    </nav>
  );
}
