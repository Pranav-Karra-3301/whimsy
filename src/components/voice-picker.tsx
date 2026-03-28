"use client";

import { useRef, useCallback } from "react";
import type { Voice } from "@/types";

interface VoicePickerProps {
  voices: Voice[];
  selectedVoiceId: string | null;
  onSelect: (voiceId: string, voiceName: string) => void;
}

export function VoicePicker({
  voices,
  selectedVoiceId,
  onSelect,
}: VoicePickerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingRef = useRef<string | null>(null);

  const preview = useCallback((voiceId: string, url?: string) => {
    if (!url) return;

    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Toggle off if same voice
    if (playingRef.current === voiceId) {
      playingRef.current = null;
      return;
    }

    const audio = new Audio(url);
    audio.play();
    audio.onended = () => {
      playingRef.current = null;
    };
    audioRef.current = audio;
    playingRef.current = voiceId;
  }, []);

  if (voices.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted">
        Loading voices...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted uppercase tracking-wider">
        Choose a voice
      </p>
      <div className="grid grid-cols-3 gap-2">
        {voices.map((voice) => {
          const isSelected = selectedVoiceId === voice.voice_id;
          const accent = voice.labels?.accent;
          const age = voice.labels?.age;
          const tag = [accent, age].filter(Boolean).join(" · ");

          return (
            <button
              key={voice.voice_id}
              onClick={() => onSelect(voice.voice_id, voice.name)}
              className={`relative px-3 py-2.5 rounded-xl text-left transition-all ${
                isSelected
                  ? "bg-accent/15 ring-2 ring-accent text-white"
                  : "bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300"
              }`}
            >
              <div className="text-xs font-medium truncate">{voice.name}</div>
              {tag && (
                <div className="text-[10px] text-muted mt-0.5 truncate">
                  {tag}
                </div>
              )}
              {voice.preview_url && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    preview(voice.voice_id, voice.preview_url);
                  }}
                  className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label={`Preview ${voice.name}`}
                >
                  <svg
                    width="8"
                    height="10"
                    viewBox="0 0 8 10"
                    fill="currentColor"
                  >
                    <path d="M0 0L8 5L0 10V0Z" />
                  </svg>
                </button>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
