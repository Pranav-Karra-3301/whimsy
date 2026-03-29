import Link from "next/link";

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-bg/80 border-b border-border-subtle">
      <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-semibold tracking-apple text-[var(--text)]"
        >
          whimsy
        </Link>
        <div className="flex gap-1">
          <Link
            href="/"
            className="px-4 py-2 rounded-full text-sm text-muted hover:text-[var(--text)] hover:bg-surface-hover transition-all duration-200"
          >
            Upload
          </Link>
          <Link
            href="/gallery"
            className="px-4 py-2 rounded-full text-sm text-muted hover:text-[var(--text)] hover:bg-surface-hover transition-all duration-200"
          >
            Gallery
          </Link>
        </div>
      </div>
    </nav>
  );
}
