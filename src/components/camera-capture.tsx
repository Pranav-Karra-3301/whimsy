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
      <div className="relative fade-in">
        <img
          src={preview}
          alt="Selected photo"
          className="w-full aspect-[4/3] object-cover rounded-3xl"
        />
        {!disabled && (
          <button
            onClick={reset}
            className="absolute top-3 right-3 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-sm font-medium shadow-sm hover:bg-white transition-colors"
          >
            Change
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 fade-in">
      <label className="block w-full py-16 rounded-3xl bg-surface border border-border-subtle shadow-card hover:shadow-card-hover hover:bg-surface-hover transition-all duration-200 text-center cursor-pointer">
        <div className="text-4xl mb-3">📷</div>
        <span className="text-sm text-muted font-medium">Take a photo</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
          disabled={disabled}
        />
      </label>
      <label className="block w-full py-5 rounded-2xl bg-surface border border-dashed border-border shadow-card hover:bg-surface-hover transition-all duration-200 text-center cursor-pointer text-sm text-muted font-medium">
        Upload from gallery
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
