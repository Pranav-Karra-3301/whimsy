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
    <div className="pt-6 space-y-5 fade-in">
      <Link
        href="/gallery"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-[var(--text)] transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="opacity-60"
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Gallery
      </Link>

      <div className="rounded-3xl overflow-hidden bg-surface border border-border shadow-sm">
        <div className="aspect-square overflow-hidden">
          <img
            src={object.image_url}
            alt={object.name}
            className={`w-full h-full object-cover ${
              object.mode === "character" ? "wobble-eyes" : ""
            }`}
          />
        </div>
        <div className="px-5 py-4">
          <h1 className="text-xl font-bold">{object.name}</h1>
          <p className="text-sm text-muted mt-1">{object.backstory}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-muted font-mono">
            <span>
              Talked {object.times_talked_to} time
              {object.times_talked_to !== 1 ? "s" : ""}
            </span>
            {object.voice_name && (
              <>
                <span className="opacity-30">|</span>
                <span>Voice: {object.voice_name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <Conversation
        objectId={object.id}
        objectName={object.name}
        personality={object.personality}
        voiceId={object.voice_id || ""}
        imageUrl={object.image_url}
      />
    </div>
  );
}
