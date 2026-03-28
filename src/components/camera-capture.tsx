"use client";

import { useRef, useState, useCallback } from "react";

interface CameraCaptureProps {
  onCapture: (base64: string, previewUrl: string) => void;
  disabled?: boolean;
}

export function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState("");

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreaming(true);
      setPreview(null);
    } catch {
      setCameraError("Camera access denied. Try uploading a photo instead.");
    }
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Wait for video to have actual dimensions
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) return;

    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const base64 = dataUrl.split(",")[1];

    // Create a blob URL for preview (more reliable than large data URLs on mobile)
    canvas.toBlob(
      (blob) => {
        stopStream();
        setStreaming(false);
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          setPreview(blobUrl);
          onCapture(base64, blobUrl);
        } else {
          // Fallback to data URL
          setPreview(dataUrl);
          onCapture(base64, dataUrl);
        }
      },
      "image/jpeg",
      0.85
    );
  }, [onCapture, stopStream]);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        // Create blob URL for preview
        const blobUrl = URL.createObjectURL(file);
        setPreview(blobUrl);
        onCapture(base64, blobUrl);
      };
      reader.readAsDataURL(file);
    },
    [onCapture]
  );

  const reset = useCallback(() => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    stopStream();
    setPreview(null);
    setStreaming(false);
    setCameraError("");
  }, [stopStream, preview]);

  if (preview) {
    return (
      <div className="relative fade-in">
        <img
          src={preview}
          alt="Captured photo"
          className="w-full aspect-[4/3] object-cover rounded-2xl"
        />
        {!disabled && (
          <button
            onClick={reset}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-sm text-sm text-white hover:bg-black/80 transition-colors"
          >
            Retake
          </button>
        )}
      </div>
    );
  }

  if (streaming) {
    return (
      <div className="relative fade-in">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full aspect-[4/3] object-cover rounded-2xl bg-neutral-900"
        />
        <canvas ref={canvasRef} className="hidden" />
        <button
          onClick={capture}
          disabled={disabled}
          className="absolute bottom-5 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-[3px] border-white bg-white/20 backdrop-blur-sm hover:bg-white/30 active:scale-90 transition-all disabled:opacity-50"
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 fade-in">
      <canvas ref={canvasRef} className="hidden" />
      <button
        onClick={startCamera}
        disabled={disabled}
        className="w-full py-12 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all text-center disabled:opacity-50"
      >
        <div className="text-3xl mb-2">📷</div>
        <span className="text-sm text-muted">Open camera</span>
      </button>
      <label className="block w-full py-4 rounded-2xl bg-white/[0.03] border border-dashed border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all text-center cursor-pointer text-sm text-muted">
        Upload a photo
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
          disabled={disabled}
        />
      </label>
      {cameraError && (
        <p className="text-sm text-red-400 text-center">{cameraError}</p>
      )}
    </div>
  );
}
