"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CameraCapture } from "@/components/camera-capture";

type Step = "capture" | "identifying" | "generating" | "saving";

const STATUS_TEXT: Record<Step, string> = {
  capture: "",
  identifying: "Identifying object...",
  generating: "Adding googly eyes...",
  saving: "Saving to gallery...",
};

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("capture");
  const [objectName, setObjectName] = useState("");
  const [error, setError] = useState("");

  const handleCapture = useCallback(
    async (base64: string) => {
      setError("");

      try {
        setStep("identifying");
        const identifyRes = await fetch("/api/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        if (!identifyRes.ok) throw new Error("Failed to identify object");
        const identity = await identifyRes.json();
        setObjectName(identity.name);

        setStep("generating");
        const [googlyRes, uploadRes] = await Promise.all([
          fetch("/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ objectName: identity.name, image: base64 }),
          }),
          fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64 }),
          }),
        ]);
        if (!googlyRes.ok) throw new Error("Failed to generate image");
        if (!uploadRes.ok) throw new Error("Failed to upload original");

        const { image_url } = await googlyRes.json();
        const { url: original_image_url } = await uploadRes.json();

        setStep("saving");
        const saveRes = await fetch("/api/objects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...identity, image_url, original_image_url }),
        });
        if (!saveRes.ok) throw new Error("Failed to save");
        const object = await saveRes.json();

        router.push(`/object/${object.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setStep("capture");
        setObjectName("");
      }
    },
    [router]
  );

  const isProcessing = step !== "capture";

  return (
    <div className="pt-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scan an object</h1>
        <p className="text-sm text-muted mt-1">
          Point your camera at anything. We&apos;ll give it googly eyes and a
          personality.
        </p>
      </div>

      <CameraCapture onCapture={handleCapture} disabled={isProcessing} />

      {isProcessing && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 fade-in">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <p className="text-sm text-muted">
            {STATUS_TEXT[step]}
            {objectName && step !== "identifying" && (
              <span className="text-white"> Met {objectName}!</span>
            )}
          </p>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 fade-in">
          {error}
        </div>
      )}
    </div>
  );
}
