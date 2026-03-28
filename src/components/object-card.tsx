import Link from "next/link";
import type { NPCObject } from "@/types";

export function ObjectCard({ object }: { object: NPCObject }) {
  return (
    <Link
      href={`/object/${object.id}`}
      className="group block rounded-2xl overflow-hidden bg-white hover:ring-2 hover:ring-accent/40 transition-all"
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={object.image_url}
          alt={object.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="px-3 py-2.5">
        <h3 className="font-semibold text-sm text-text-on-light truncate">
          {object.name}
        </h3>
        <p className="text-xs text-[var(--muted-on-light)] mt-0.5 line-clamp-1">
          {object.backstory}
        </p>
      </div>
    </Link>
  );
}
