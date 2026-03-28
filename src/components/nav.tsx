import Link from "next/link";

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-bg/80 border-b border-border">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-primary"
        >
          whimsy
        </Link>
        <div className="flex gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg text-sm text-muted hover:text-[var(--text)] hover:bg-surface-hover transition-colors"
          >
            Upload
          </Link>
          <Link
            href="/gallery"
            className="px-3 py-1.5 rounded-lg text-sm text-muted hover:text-[var(--text)] hover:bg-surface-hover transition-colors"
          >
            Gallery
          </Link>
        </div>
      </div>
    </nav>
  );
}
