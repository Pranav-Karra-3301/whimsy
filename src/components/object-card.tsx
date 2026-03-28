import Link from "next/link";
import type { NPCObject } from "@/types";

export function ObjectCard({ object }: { object: NPCObject }) {
  return (
    <Link
      href={`/object/${object.id}`}
      className="group block rounded-lg border border-border bg-surface overflow-hidden hover:border-accent/50 transition-colors"
    >
      <div className="aspect-square relative overflow-hidden bg-neutral-800">
        <img
          src={object.image_url}
          alt={object.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 wobble-eyes"
        />
      </div>
      <div className="p-3">
        <h3 className="font-mono font-bold text-sm truncate">{object.name}</h3>
        <p className="text-xs text-muted mt-1 line-clamp-2">{object.backstory}</p>
        <p className="text-xs text-muted mt-2 font-mono">
          talked {object.times_talked_to}x
        </p>
      </div>
    </Link>
  );
}
