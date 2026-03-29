import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pt-32 text-center space-y-5 fade-in">
      <div className="text-6xl">📷</div>
      <h1 className="text-2xl font-semibold tracking-apple">Not found</h1>
      <p className="text-base text-muted leading-relaxed max-w-sm mx-auto">
        This conversation doesn&apos;t exist or was deleted.
      </p>
      <Link
        href="/"
        className="inline-block mt-4 px-6 py-3 rounded-full bg-primary text-white text-sm font-medium tracking-apple hover:bg-primary-hover transition-colors"
      >
        Upload a photo
      </Link>
    </div>
  );
}
