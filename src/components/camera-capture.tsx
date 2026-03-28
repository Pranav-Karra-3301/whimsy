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
          className="w-full aspect-[4/3] object-cover rounded-2xl"
        />
        {!disabled && (
          <button
            onClick={reset}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur-sm text-sm shadow-sm hover:bg-white transition-colors"
          >
            Change
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 fade-in">
      <label className="block w-full py-12 rounded-2xl bg-surface border border-border shadow-sm hover:bg-surface-hover transition-all text-center cursor-pointer">
        <div className="text-3xl mb-2">📷</div>
        <span className="text-sm text-muted">Take a photo</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
          disabled={disabled}
        />
      </label>
      <label className="block w-full py-4 rounded-2xl bg-surface border border-dashed border-border shadow-sm hover:bg-surface-hover transition-all text-center cursor-pointer text-sm text-muted">
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
