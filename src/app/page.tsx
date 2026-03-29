"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/camera-capture";
import Link from "next/link";
import type { IdentifyResponse } from "@/types";

type Mode = "photo" | "character";
type Step = "upload" | "processing" | "saving";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("photo");
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState("");
  const [statusText, setStatusText] = useState("");

  const handleCapture = useCallback(
    async (base64: string) => {
      setError("");
      setStep("processing");
      setStatusText(
        mode === "photo"
          ? "Understanding your photo..."
          : "Creating your character..."
      );

      try {
        const [identifyRes, imageRes, voicesRes] = await Promise.all([
          fetch("/api/identify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64, mode }),
          }),
          fetch("/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64, mode }),
          }),
          fetch("/api/voices?limit=50"),
        ]);

        if (!identifyRes.ok) throw new Error("Failed to understand the image");
        if (!imageRes.ok) throw new Error("Failed to process image");

        const identity: IdentifyResponse = await identifyRes.json();
        const { image_url } = await imageRes.json();
        const voicesData = voicesRes.ok
          ? await voicesRes.json()
          : { voices: [] };

        const voices = voicesData.voices ?? [];
        const pick =
          voices.length > 0
            ? voices[Math.floor(Math.random() * voices.length)]
            : null;

        setStep("saving");
        setStatusText(`Saving "${identity.name}"...`);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        if (!uploadRes.ok) throw new Error("Failed to save image");
        const { url: original_image_url } = await uploadRes.json();

        const saveRes = await fetch("/api/objects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...identity,
            image_url,
            original_image_url,
            voice_id: pick?.voice_id || "",
            voice_name: pick?.name || "",
            mode,
          }),
        });
        if (!saveRes.ok) throw new Error("Failed to save");
        const object = await saveRes.json();

        router.push(`/object/${object.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setStep("upload");
        setStatusText("");
      }
    },
    [mode, router]
  );

  return (
    <div className="max-w-xl mx-auto px-5 pt-16 pb-32 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <h1 className="font-display text-4xl text-[var(--text)]">whimsy</h1>
        <Link
          href="/gallery"
          className="text-sm text-muted hover:text-[var(--text)] transition-colors"
        >
          Gallery
        </Link>
      </div>

      {/* Intro */}
      <div className="mb-10">
        <h2 className="font-display text-3xl leading-snug mb-3">
          Every picture
          <br />
          has a story to tell
        </h2>
        <p className="text-base text-muted leading-relaxed max-w-sm">
          Upload a photo, painting, or memory — and start a conversation with
          it.
        </p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button
          onClick={() => setMode("photo")}
          disabled={step !== "upload"}
          className={`relative p-5 rounded-2xl text-left transition-all duration-300 border ${
            mode === "photo"
              ? "bg-surface border-accent/25 shadow-card-hover"
              : "bg-surface/60 border-border-subtle hover:bg-surface hover:shadow-card"
          }`}
        >
          <div className="text-2xl mb-3">🖼️</div>
          <p className="text-sm font-medium tracking-apple">Photo</p>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Talk to paintings, memories, places
          </p>
          {mode === "photo" && (
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent" />
          )}
        </button>
        <button
          onClick={() => setMode("character")}
          disabled={step !== "upload"}
          className={`relative p-5 rounded-2xl text-left transition-all duration-300 border ${
            mode === "character"
              ? "bg-surface border-accent/25 shadow-card-hover"
              : "bg-surface/60 border-border-subtle hover:bg-surface hover:shadow-card"
          }`}
        >
          <div className="text-2xl mb-3">👀</div>
          <p className="text-sm font-medium tracking-apple">Character</p>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Googly eyes, funny voice
          </p>
          {mode === "character" && (
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {/* Upload */}
      {step === "upload" && (
        <ImageUpload onCapture={handleCapture} disabled={false} />
      )}

      {/* Processing / Saving */}
      {(step === "processing" || step === "saving") && (
        <div className="flex flex-col items-center gap-5 py-20 fade-in">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="text-sm text-muted font-display text-lg">
            {statusText}
          </p>
        </div>
      )}

      {error && (
        <div className="px-5 py-4 rounded-2xl bg-red-50/60 border border-red-100/60 text-sm text-red-600 fade-in mt-4">
          {error}
        </div>
      )}
    </div>
  );
}
