import { getObjectById } from "@/lib/db";
import { notFound } from "next/navigation";
import { Conversation } from "@/components/conversation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ObjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const object = await getObjectById(id);

  if (!object) {
    notFound();
  }

  return (
    <div className="space-y-6 pt-4">
      <Link
        href="/gallery"
        className="text-sm text-muted font-mono hover:text-neutral-200 transition-colors"
      >
        ← gallery
      </Link>

      <div className="rounded-lg border border-border overflow-hidden bg-surface">
        <div className="aspect-square relative overflow-hidden bg-neutral-800">
          <img
            src={object.image_url}
            alt={object.name}
            className="w-full h-full object-cover wobble-eyes"
          />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="font-mono text-2xl font-bold">{object.name}</h1>
        <p className="text-sm text-muted">{object.backstory}</p>
        <p className="text-xs text-muted font-mono">
          talked {object.times_talked_to} time{object.times_talked_to !== 1 ? "s" : ""}
        </p>
      </div>

      <Conversation
        objectId={object.id}
        objectName={object.name}
        personality={object.personality}
        voiceId={object.voice_id}
      />
    </div>
  );
}
