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
    <div className="pt-8 space-y-6 fade-in">
      <Link
        href="/gallery"
        className="group inline-flex items-center gap-1 text-sm text-muted font-medium hover:text-[var(--text)] transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="opacity-60 group-hover:translate-x-[-2px] transition-transform"
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

      <div className="rounded-4xl overflow-hidden bg-surface shadow-card-hover">
        <div className="aspect-square overflow-hidden">
          <img
            src={object.image_url}
            alt={object.name}
            className={`w-full h-full object-cover ${
              object.mode === "character" ? "wobble-eyes" : ""
            }`}
          />
        </div>
        <div className="px-6 py-5">
          <h1 className="text-2xl font-semibold tracking-apple">
            {object.name}
          </h1>
          <p className="text-base text-muted mt-2 leading-relaxed">
            {object.backstory}
          </p>
          <div className="flex items-center gap-3 mt-4 text-xs text-muted font-mono">
            <span>
              Talked {object.times_talked_to} time
              {object.times_talked_to !== 1 ? "s" : ""}
            </span>
            {object.voice_name && (
              <>
                <span className="opacity-20">|</span>
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
