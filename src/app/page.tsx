"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CameraCapture } from "@/components/camera-capture";

type Step = "capture" | "identifying" | "generating" | "saving" | "done";

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("capture");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleCapture = async (base64: string) => {
    setError("");

    try {
      // Step 1: Identify
      setStep("identifying");
      setStatus("identifying object with gemini...");

      const identifyRes = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!identifyRes.ok) throw new Error("Failed to identify object");
      const identity = await identifyRes.json();

      // Step 2: Generate googly image + upload original in parallel
      setStep("generating");
      setStatus(`met ${identity.name}! generating googly eyes...`);

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

      // Step 3: Save to DB
      setStep("saving");
      setStatus("saving to gallery...");

      const saveRes = await fetch("/api/objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...identity,
          image_url,
          original_image_url,
        }),
      });

      if (!saveRes.ok) throw new Error("Failed to save object");
      const object = await saveRes.json();

      setStep("done");
      router.push(`/object/${object.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("capture");
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="font-mono text-2xl font-bold">scan an object</h1>
        <p className="text-sm text-muted mt-1">
          point your camera at anything. we&apos;ll give it googly eyes and a personality.
        </p>
      </div>

      <CameraCapture
        onCapture={handleCapture}
        disabled={step !== "capture"}
      />

      {status && step !== "capture" && (
        <div className="flex items-center gap-2 font-mono text-sm text-muted">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          {status}
        </div>
      )}

      {error && (
        <div className="font-mono text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
          {error}
        </div>
      )}
    </div>
  );
}
