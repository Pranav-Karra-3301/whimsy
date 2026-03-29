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
      className={`group block rounded-3xl overflow-hidden bg-surface shadow-card hover:shadow-card-hover transition-all duration-300 ${
        deleting ? "opacity-40 pointer-events-none" : ""
      }`}
    >
      <div className="aspect-square overflow-hidden relative">
        <img
          src={object.image_url}
          alt={object.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <button
          onClick={handleDelete}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
          aria-label="Delete"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {object.mode === "character" && (
          <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-[10px] font-medium shadow-sm">
            Character
          </span>
        )}
      </div>
      <div className="px-4 py-3.5">
        <h3 className="font-medium text-sm tracking-apple truncate">
          {object.name}
        </h3>
        <p className="text-xs text-muted mt-1 line-clamp-1">
          {object.backstory}
        </p>
      </div>
    </Link>
  );
}
