"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CameraCapture } from "@/components/camera-capture";
import { Conversation } from "@/components/conversation";
import type { IdentifyResponse } from "@/types";

type Step = "capture" | "processing" | "result" | "saving";

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("capture");
  const [error, setError] = useState("");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [googlyImageUrl, setGooglyImageUrl] = useState<string | null>(null);
  const [identity, setIdentity] = useState<IdentifyResponse | null>(null);
  const [voiceId, setVoiceId] = useState("");
  const [voiceName, setVoiceName] = useState("");

  const handleCapture = useCallback(
    async (base64: string, preview: string) => {
      setError("");
      setCapturedImage(base64);
      setPreviewUrl(preview);
      setStep("processing");

      try {
        const [identifyRes, googlyRes, voicesRes] = await Promise.all([
          fetch("/api/identify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64 }),
          }),
          fetch("/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64 }),
          }),
          fetch("/api/voices?limit=50"),
        ]);

        if (!identifyRes.ok) throw new Error("Failed to identify object");
        if (!googlyRes.ok) throw new Error("Failed to generate image");

        const identityData = await identifyRes.json();
        const { image_url } = await googlyRes.json();
        const voicesData = voicesRes.ok
          ? await voicesRes.json()
          : { voices: [] };

        // Auto-pick a random voice
        const voices = voicesData.voices ?? [];
        const pick = voices.length > 0
          ? voices[Math.floor(Math.random() * voices.length)]
          : null;

        setIdentity(identityData);
        setGooglyImageUrl(image_url);
        if (pick) {
          setVoiceId(pick.voice_id);
          setVoiceName(pick.name);
        }
        setStep("result");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setStep("capture");
      }
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!capturedImage || !googlyImageUrl || !identity) return;
    setStep("saving");

    try {
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedImage }),
      });
      if (!uploadRes.ok) throw new Error("Failed to upload");
      const { url: original_image_url } = await uploadRes.json();

      const saveRes = await fetch("/api/objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...identity,
          image_url: googlyImageUrl,
          original_image_url,
          voice_id: voiceId,
          voice_name: voiceName,
        }),
      });
      if (!saveRes.ok) throw new Error("Failed to save");
      const object = await saveRes.json();

      router.push(`/object/${object.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setStep("result");
    }
  }, [capturedImage, googlyImageUrl, identity, voiceId, voiceName, router]);

  const handleRetake = useCallback(() => {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setStep("capture");
    setCapturedImage(null);
    setPreviewUrl(null);
    setGooglyImageUrl(null);
    setIdentity(null);
    setVoiceId("");
    setVoiceName("");
    setError("");
  }, [previewUrl]);

  const showCapture = step === "capture" || step === "processing";

  return (
    <div className="pt-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scan an object</h1>
        <p className="text-sm text-muted mt-1">
          Point your camera at anything. We&apos;ll turn it into a character you
          can talk to.
        </p>
      </div>

      {/* Capture + Processing */}
      {showCapture && (
        <>
          <CameraCapture
            onCapture={handleCapture}
            disabled={step === "processing"}
          />
          {step === "processing" && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 fade-in">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <p className="text-sm text-muted">
                Creating your character...
              </p>
            </div>
          )}
        </>
      )}

      {/* Result */}
      {(step === "result" || step === "saving") &&
        identity &&
        googlyImageUrl && (
          <div className="space-y-5 fade-in">
            <div className="rounded-3xl overflow-hidden bg-white">
              <img
                src={googlyImageUrl}
                alt={identity.name}
                className="w-full aspect-square object-cover"
              />
              <div className="px-5 py-4">
                <h2 className="text-lg font-bold text-text-on-light">
                  {identity.name}
                </h2>
                <p className="text-sm text-[var(--muted-on-light)] mt-1">
                  {identity.backstory}
                </p>
                {voiceName && (
                  <p className="text-xs text-[var(--muted-on-light)] mt-2 font-mono">
                    Voice: {voiceName}
                  </p>
                )}
              </div>
            </div>

            {/* Talk */}
            <Conversation
              objectId=""
              objectName={identity.name}
              personality={identity.personality}
              voiceId={voiceId}
              imageUrl={googlyImageUrl}
            />

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleRetake}
                disabled={step === "saving"}
                className="flex-1 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-sm font-medium hover:bg-white/[0.1] transition-all disabled:opacity-50"
              >
                Retake
              </button>
              <button
                onClick={handleSave}
                disabled={step === "saving"}
                className="flex-1 py-3 rounded-2xl bg-white text-bg text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {step === "saving" ? "Saving..." : "Save to Gallery"}
              </button>
            </div>
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
