import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-5 pt-40 text-center space-y-5 fade-in">
      <div className="text-5xl mb-2">📷</div>
      <h1 className="font-display text-3xl">Not found</h1>
      <p className="text-base text-muted leading-relaxed max-w-xs mx-auto">
        This conversation doesn&apos;t exist or may have been deleted.
      </p>
      <Link
        href="/"
        className="inline-block mt-6 px-6 py-3 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
      >
        Upload a photo
      </Link>
    </div>
  );
}
