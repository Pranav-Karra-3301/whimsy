import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pt-20 text-center space-y-4">
      <div className="text-5xl">👀</div>
      <h1 className="text-xl font-bold">Not found</h1>
      <p className="text-sm text-muted">
        This object doesn&apos;t exist or was deleted.
      </p>
      <Link
        href="/"
        className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-accent text-bg text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Scan something new
      </Link>
    </div>
  );
}
