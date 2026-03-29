import { getAllObjects } from "@/lib/db";
import { ObjectCard } from "@/components/object-card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const objects = await getAllObjects();

  return (
    <div className="max-w-2xl mx-auto px-5 pt-16 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <Link
          href="/"
          className="font-display text-4xl text-[var(--text)] hover:text-accent transition-colors"
        >
          whimsy
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          New photo
        </Link>
      </div>

      {/* Title */}
      <div className="mb-10">
        <h1 className="font-display text-3xl mb-2">Your memories</h1>
        <p className="text-sm text-muted">
          {objects.length > 0
            ? `${objects.length} conversation${objects.length !== 1 ? "s" : ""}`
            : "No conversations yet"}
        </p>
      </div>

      {objects.length === 0 ? (
        <div className="text-center py-28 fade-in">
          <div className="text-5xl mb-5">📷</div>
          <p className="font-display text-xl text-muted mb-2">
            Nothing here yet
          </p>
          <p className="text-sm text-muted mb-8">
            Upload a photo to start your first conversation.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            Upload a photo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {objects.map((obj, i) => (
            <div
              key={obj.id}
              className="fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <ObjectCard object={obj} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
