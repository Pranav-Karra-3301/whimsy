"use client";

import { useRef, useState, useCallback } from "react";

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  disabled?: boolean;
}

export function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
      setPreview(null);
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const base64 = dataUrl.split(",")[1];

    // Stop camera
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStreaming(false);
    setPreview(dataUrl);
    onCapture(base64);
  }, [onCapture]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        setPreview(dataUrl);
        onCapture(base64);
      };
      reader.readAsDataURL(file);
    },
    [onCapture]
  );

  const reset = useCallback(() => {
    setPreview(null);
    setStreaming(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Captured"
            className="w-full rounded-lg border border-border"
          />
          {!disabled && (
            <button
              onClick={reset}
              className="absolute top-2 right-2 bg-surface/80 backdrop-blur text-sm px-3 py-1 rounded-md border border-border hover:bg-border transition-colors"
            >
              retake
            </button>
          )}
        </div>
      ) : streaming ? (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg border border-border"
          />
          <button
            onClick={capture}
            disabled={disabled}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 transition-colors disabled:opacity-50"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            onClick={startCamera}
            disabled={disabled}
            className="w-full py-4 rounded-lg border border-border bg-surface hover:bg-border transition-colors font-mono text-sm disabled:opacity-50"
          >
            open camera
          </button>
          <label className="w-full py-4 rounded-lg border border-dashed border-border bg-surface hover:bg-border transition-colors font-mono text-sm text-center cursor-pointer block">
            or upload a photo
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={disabled}
            />
          </label>
        </div>
      )}
    </div>
  );
}
