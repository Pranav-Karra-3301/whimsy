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
    <div className="pt-12 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-apple">
          Talk to a picture
        </h1>
        <p className="text-base text-muted mt-2">
          Upload any photo, painting, or memory and start a conversation.
        </p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setMode("photo")}
          disabled={step !== "upload"}
          className={`p-5 rounded-3xl text-left transition-all duration-200 border ${
            mode === "photo"
              ? "bg-accent-light border-accent/20 shadow-card"
              : "bg-surface border-border-subtle shadow-card hover:shadow-card-hover"
          }`}
        >
          <div className="text-2xl mb-2">🖼️</div>
          <p className="text-sm font-medium tracking-apple">Talk to a Photo</p>
          <p className="text-xs text-muted mt-1">
            Paintings, memories, places
          </p>
        </button>
        <button
          onClick={() => setMode("character")}
          disabled={step !== "upload"}
          className={`p-5 rounded-3xl text-left transition-all duration-200 border ${
            mode === "character"
              ? "bg-accent-light border-accent/20 shadow-card"
              : "bg-surface border-border-subtle shadow-card hover:shadow-card-hover"
          }`}
        >
          <div className="text-2xl mb-2">👀</div>
          <p className="text-sm font-medium tracking-apple">
            Create a Character
          </p>
          <p className="text-xs text-muted mt-1">
            Googly eyes, funny voice
          </p>
        </button>
      </div>

      {/* Upload */}
      {step === "upload" && (
        <ImageUpload onCapture={handleCapture} disabled={false} />
      )}

      {/* Processing / Saving */}
      {(step === "processing" || step === "saving") && (
        <div className="flex flex-col items-center gap-4 py-16 fade-in">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted font-medium">{statusText}</p>
        </div>
      )}

      {error && (
        <div className="px-5 py-4 rounded-2xl bg-red-50/80 border border-red-100 text-sm text-red-600 fade-in">
          {error}
        </div>
      )}
    </div>
  );
}
