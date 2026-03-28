import { getAllObjects } from "@/lib/db";
import { ObjectCard } from "@/components/object-card";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const objects = await getAllObjects();

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="font-mono text-2xl font-bold">gallery</h1>
        <p className="text-sm text-muted mt-1">
          all your npcified objects. tap to talk again.
        </p>
      </div>

      {objects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted font-mono text-sm">no objects yet.</p>
          <p className="text-muted font-mono text-xs mt-1">
            scan something to get started.
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
