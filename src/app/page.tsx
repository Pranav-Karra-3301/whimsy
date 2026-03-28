"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/camera-capture";
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
        // Parallel: identify + process image + pick voice
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

        // Pick random voice
        const voices = voicesData.voices ?? [];
        const pick =
          voices.length > 0
            ? voices[Math.floor(Math.random() * voices.length)]
            : null;

        // Auto-save
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
    <div className="pt-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Talk to a picture
        </h1>
        <p className="text-sm text-muted mt-1">
          Upload any photo, painting, or memory and start a conversation.
        </p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setMode("photo")}
          disabled={step !== "upload"}
          className={`p-4 rounded-2xl text-left transition-all border ${
            mode === "photo"
              ? "bg-primary-light border-primary/30 shadow-sm"
              : "bg-surface border-border hover:bg-surface-hover"
          }`}
        >
          <div className="text-xl mb-1">🖼️</div>
          <p className="text-sm font-semibold">Talk to a Photo</p>
          <p className="text-xs text-muted mt-0.5">
            Paintings, memories, places
          </p>
        </button>
        <button
          onClick={() => setMode("character")}
          disabled={step !== "upload"}
          className={`p-4 rounded-2xl text-left transition-all border ${
            mode === "character"
              ? "bg-primary-light border-primary/30 shadow-sm"
              : "bg-surface border-border hover:bg-surface-hover"
          }`}
        >
          <div className="text-xl mb-1">👀</div>
          <p className="text-sm font-semibold">Create a Character</p>
          <p className="text-xs text-muted mt-0.5">
            Googly eyes, funny voice
          </p>
        </button>
      </div>

      {/* Upload */}
      {step === "upload" && (
        <ImageUpload
          onCapture={handleCapture}
          disabled={false}
        />
      )}

      {/* Processing / Saving */}
      {(step === "processing" || step === "saving") && (
        <div className="flex flex-col items-center gap-4 py-12 fade-in">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted">{statusText}</p>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-600 fade-in">
          {error}
        </div>
      )}
    </div>
  );
}
