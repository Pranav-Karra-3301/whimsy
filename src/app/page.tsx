"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CameraCapture } from "@/components/camera-capture";
import { VoicePicker } from "@/components/voice-picker";
import { Conversation } from "@/components/conversation";
import type { IdentifyResponse, Voice } from "@/types";

type Step = "capture" | "processing" | "result" | "saving";

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("capture");
  const [error, setError] = useState("");

  // Pipeline data
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [googlyImageUrl, setGooglyImageUrl] = useState<string | null>(null);
  const [identity, setIdentity] = useState<IdentifyResponse | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);
  const [talking, setTalking] = useState(false);

  const handleVoiceSelect = useCallback((voiceId: string, voiceName: string) => {
    setSelectedVoiceId(voiceId);
    setSelectedVoiceName(voiceName);
  }, []);

  const handleCapture = useCallback(async (base64: string) => {
    setError("");
    setCapturedImage(base64);
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
        fetch("/api/voices?page_size=18"),
      ]);

      if (!identifyRes.ok) throw new Error("Failed to identify object");
      if (!googlyRes.ok) throw new Error("Failed to generate image");

      const identityData = await identifyRes.json();
      const { image_url } = await googlyRes.json();
      const voicesData = voicesRes.ok ? await voicesRes.json() : { voices: [] };

      setIdentity(identityData);
      setGooglyImageUrl(image_url);
      setVoices(voicesData.voices ?? []);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("capture");
    }
  }, []);

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
          voice_id: selectedVoiceId || "",
          voice_name: selectedVoiceName || "",
        }),
      });
      if (!saveRes.ok) throw new Error("Failed to save");
      const object = await saveRes.json();

      router.push(`/object/${object.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setStep("result");
    }
  }, [capturedImage, googlyImageUrl, identity, selectedVoiceId, selectedVoiceName, router]);

  const handleRetake = useCallback(() => {
    setStep("capture");
    setCapturedImage(null);
    setGooglyImageUrl(null);
    setIdentity(null);
    setSelectedVoiceId(null);
    setSelectedVoiceName(null);
    setTalking(false);
    setError("");
  }, []);

  return (
    <div className="pt-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scan an object</h1>
        <p className="text-sm text-muted mt-1">
          Point your camera at anything. We&apos;ll give it googly eyes and a
          personality.
        </p>
      </div>

      {/* Capture step */}
      {step === "capture" && (
        <CameraCapture onCapture={handleCapture} disabled={false} />
      )}

      {/* Processing step */}
      {step === "processing" && (
        <div className="space-y-4 fade-in">
          {capturedImage && (
            <img
              src={`data:image/jpeg;base64,${capturedImage}`}
              alt="Captured"
              className="w-full aspect-[4/3] object-cover rounded-2xl opacity-60"
            />
          )}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <p className="text-sm text-muted">Adding googly eyes...</p>
          </div>
        </div>
      )}

      {/* Result step */}
      {(step === "result" || step === "saving") && identity && googlyImageUrl && (
        <div className="space-y-5 fade-in">
          {/* Googly image card */}
          <div className="rounded-3xl overflow-hidden bg-white">
            <img
              src={googlyImageUrl}
              alt={identity.name}
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="px-5 py-4">
              <h2 className="text-lg font-bold text-text-on-light">
                {identity.name}
              </h2>
              <p className="text-sm text-[var(--muted-on-light)] mt-1">
                {identity.backstory}
              </p>
            </div>
          </div>

          {/* Voice picker */}
          {!talking && (
            <VoicePicker
              voices={voices}
              selectedVoiceId={selectedVoiceId}
              onSelect={handleVoiceSelect}
            />
          )}

          {/* Talk / Conversation */}
          {!talking && selectedVoiceId && (
            <button
              onClick={() => setTalking(true)}
              className="w-full py-3.5 rounded-2xl bg-accent text-bg font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Talk to {identity.name}
            </button>
          )}

          {talking && selectedVoiceId && (
            <Conversation
              objectId=""
              objectName={identity.name}
              personality={identity.personality}
              voiceId={selectedVoiceId}
            />
          )}

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
