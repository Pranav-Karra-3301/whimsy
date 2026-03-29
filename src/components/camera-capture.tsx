"use client";

import { useState, useCallback } from "react";

interface ImageUploadProps {
  onCapture: (base64: string, previewUrl: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ onCapture, disabled }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
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
    setPreview(null);
  }, [preview]);

  if (preview) {
    return (
      <div className="relative scale-in">
        <img
          src={preview}
          alt="Selected photo"
          className="w-full aspect-[4/5] object-cover rounded-2xl shadow-card-hover"
        />
        {!disabled && (
          <button
            onClick={reset}
            className="absolute top-3 right-3 px-4 py-1.5 rounded-full bg-black/30 backdrop-blur-md text-sm font-medium text-white/90 hover:bg-black/50 transition-all"
          >
            Change
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 fade-in">
      <label className="group block w-full py-20 rounded-2xl bg-surface border border-dashed border-border hover:border-accent/30 hover:shadow-card transition-all duration-300 text-center cursor-pointer">
        <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
          📷
        </div>
        <span className="text-sm text-muted font-medium">
          Take a photo
        </span>
        <span className="block text-xs text-muted/60 mt-1">
          or tap to choose from your library
        </span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
          disabled={disabled}
        />
      </label>
      <label className="block w-full py-4 rounded-xl bg-surface-hover/50 hover:bg-surface-hover transition-colors duration-200 text-center cursor-pointer text-sm text-muted font-medium">
        Upload from files
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
          disabled={disabled}
        />
      </label>
    </div>
  );
}
