import { getAllObjects } from "@/lib/db";
import { ObjectCard } from "@/components/object-card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const objects = await getAllObjects();

  return (
    <div className="pt-8 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gallery</h1>
          <p className="text-sm text-muted mt-1">
            {objects.length > 0
              ? `${objects.length} object${objects.length !== 1 ? "s" : ""} npcified`
              : "No objects yet"}
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-accent text-bg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Scan
        </Link>
      </div>

      {objects.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">👀</div>
          <p className="text-muted text-sm">
            Scan something to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {objects.map((obj) => (
            <ObjectCard key={obj.id} object={obj} />
          ))}
        </div>
      )}
    </div>
  );
}
