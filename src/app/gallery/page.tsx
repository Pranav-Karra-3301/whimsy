import { getAllObjects } from "@/lib/db";
import { ObjectCard } from "@/components/object-card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const objects = await getAllObjects();

  return (
    <div className="pt-12 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-apple">Gallery</h1>
          <p className="text-base text-muted mt-2">
            {objects.length > 0
              ? `${objects.length} conversation${objects.length !== 1 ? "s" : ""}`
              : "No conversations yet"}
          </p>
        </div>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-medium tracking-apple hover:bg-primary-hover transition-colors"
        >
          Upload
        </Link>
      </div>

      {objects.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">📷</div>
          <p className="text-muted text-base">
            Upload a photo to start your first conversation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {objects.map((obj, i) => (
            <div
              key={obj.id}
              className="fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <ObjectCard object={obj} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
