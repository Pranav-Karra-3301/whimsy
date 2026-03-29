"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { NPCObject } from "@/types";

export function ObjectCard({ object }: { object: NPCObject }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDeleting(true);
      await fetch(`/api/objects/${object.id}`, { method: "DELETE" });
      router.refresh();
    },
    [object.id, router]
  );

  return (
    <Link
      href={`/object/${object.id}`}
      className={`group block rounded-2xl overflow-hidden bg-surface shadow-card hover:shadow-card-hover transition-all duration-300 ${
        deleting ? "opacity-40 pointer-events-none" : ""
      }`}
    >
      <div className="aspect-[4/5] overflow-hidden relative">
        <img
          src={object.image_url}
          alt={object.name}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
        />
        {/* Gradient overlay with name */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent px-3.5 pb-3.5 pt-12">
          <h3 className="font-display text-base text-white truncate">
            {object.name}
          </h3>
          <p className="text-[11px] text-white/60 mt-0.5 line-clamp-1">
            {object.backstory}
          </p>
        </div>
        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/80 text-white/80 hover:text-white"
          aria-label="Delete"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {object.mode === "character" && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-md text-[10px] font-medium text-white/80">
            Character
          </span>
        )}
      </div>
    </Link>
  );
}
