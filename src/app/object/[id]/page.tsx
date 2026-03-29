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
    <div className="min-h-screen fade-in">
      {/* Back nav — floating over the image */}
      <div className="fixed top-0 left-0 right-0 z-40 px-5 pt-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md text-sm font-medium text-[var(--text)] shadow-soft hover:bg-white transition-all"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </Link>
        </div>
      </div>

      {/* Hero image — full width, immersive */}
      <div className="relative w-full aspect-[3/4] max-h-[75vh] overflow-hidden">
        <img
          src={object.image_url}
          alt={object.name}
          className={`w-full h-full object-cover ${
            object.mode === "character" ? "wobble-eyes" : ""
          }`}
        />
        {/* Vignette */}
        <div className="absolute inset-0 vignette pointer-events-none" />
        {/* Bottom gradient with text */}
        <div className="absolute inset-x-0 bottom-0 memory-gradient px-6 pb-6 pt-32">
          <h1 className="font-display text-4xl text-white mb-2">
            {object.name}
          </h1>
          <p className="text-sm text-white/70 leading-relaxed max-w-md">
            {object.backstory}
          </p>
        </div>
      </div>

      {/* Content below image */}
      <div className="max-w-xl mx-auto px-6 -mt-3 relative z-10">
        {/* Stats */}
        <div className="flex items-center gap-4 py-5 text-xs text-muted font-mono">
          <span>
            Talked {object.times_talked_to} time
            {object.times_talked_to !== 1 ? "s" : ""}
          </span>
          {object.voice_name && (
            <>
              <span className="opacity-20">|</span>
              <span>{object.voice_name}</span>
            </>
          )}
          {object.mode === "character" && (
            <>
              <span className="opacity-20">|</span>
              <span className="text-accent">Character</span>
            </>
          )}
        </div>

        {/* Talk button */}
        <Conversation
          objectId={object.id}
          objectName={object.name}
          personality={object.personality}
          backstory={object.backstory}
        />
      </div>
    </div>
  );
}
