"use client";

import { useCallback, useRef, useState } from "react";

interface ConversationProps {
  objectId: string;
  objectName: string;
  personality: string;
  voiceId: string;
  imageUrl?: string;
}

interface Message {
  role: "user" | "assistant";
  text: string;
}

type Status = "idle" | "recording" | "processing" | "playing" | "ended";

export function Conversation({
  objectId,
  objectName,
  personality,
  voiceId,
  imageUrl,
}: ConversationProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  }, []);

  const startRecording = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      recorderRef.current = recorder;
      setStatus("recording");
    } catch {
      setError("Microphone access is required.");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;

    setStatus("processing");

    const audioBlob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(chunksRef.current, { type: recorder.mimeType }));
      };
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    });

    const buffer = await audioBlob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((s, b) => s + String.fromCharCode(b), "")
    );

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: base64,
          history: messages,
          character: { name: objectName, personality },
          voiceId,
        }),
      });

      if (!res.ok) throw new Error("Chat failed");
      const data = await res.json();

      const newMessages: Message[] = [];
      if (data.transcript)
        newMessages.push({ role: "user", text: data.transcript });
      if (data.response)
        newMessages.push({ role: "assistant", text: data.response });
      setMessages((prev) => [...prev, ...newMessages]);
      scrollToBottom();

      if (data.audio) {
        setStatus("playing");
        const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
        audioRef.current = audio;
        audio.onended = () => setStatus("idle");
        audio.onerror = () => setStatus("idle");
        audio.play().catch(() => setStatus("idle"));
      } else {
        setStatus("idle");
      }
    } catch {
      setError("Failed to get response. Try again.");
      setStatus("idle");
    }
  }, [messages, objectName, personality, voiceId, scrollToBottom]);

  const endConversation = useCallback(() => {
    audioRef.current?.pause();
    recorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    setStatus("ended");
    if (objectId) {
      fetch(`/api/objects/${objectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment_talk: true }),
      });
    }
  }, [objectId]);

  const close = useCallback(() => {
    setOpen(false);
    setStatus("idle");
    setMessages([]);
    setError("");
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-4 rounded-full bg-primary text-white font-medium text-sm tracking-apple hover:bg-primary-hover active:scale-[0.98] transition-all shadow-card-hover"
      >
        Talk to {objectName}
      </button>
    );
  }

  const statusLabel =
    status === "recording"
      ? "REC ●"
      : status === "processing"
        ? "PROCESSING..."
        : status === "playing"
          ? "PLAYING..."
          : status === "ended"
            ? "SIGNAL LOST"
            : "STANDBY";

  return (
    <div className="fixed inset-0 z-50 bg-[var(--crt-screen)] overflow-hidden crt-flicker">
      {/* ── CRT effect layers ── */}

      {/* Green phosphor wash over the dark screen */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(12,204,104,0.06),transparent_70%)] pointer-events-none" />

      {/* Scanlines */}
      <div className="crt-scanlines" />

      {/* Scan beam */}
      <div className="crt-scanbeam" />

      {/* Vignette */}
      <div className="crt-vignette" />

      {/* Glass reflection */}
      <div className="crt-reflection" />

      {/* 3D Bezel frame */}
      <div className="crt-bezel" />

      {/* ── Screen content ── */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top status bar */}
        <div
          className="flex items-center justify-between px-5 sm:px-8 pb-2 border-b border-[var(--crt-green)]/10"
          style={{ paddingTop: "max(env(safe-area-inset-top, 12px), 12px)" }}
        >
          <div className="flex items-center gap-3">
            {status === "ended" ? (
              <button
                onClick={close}
                className="font-mono text-xs crt-text hover:brightness-125 transition-all px-3 py-1.5 border border-[var(--crt-green)]/30 rounded"
              >
                [EXIT]
              </button>
            ) : (
              <button
                onClick={endConversation}
                className="font-mono text-xs crt-text-dim hover:text-[var(--crt-green)] transition-colors px-3 py-1.5 border border-[var(--crt-green)]/15 rounded"
              >
                [END]
              </button>
            )}
          </div>

          <span
            className={`font-mono text-[11px] tracking-wider ${
              status === "recording"
                ? "text-red-400 animate-pulse"
                : "crt-text-dim"
            }`}
          >
            {statusLabel}
          </span>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] crt-text-dim tracking-wider hidden sm:inline">
              WHIMSY
            </span>
            <div className={status === "ended" ? "crt-led-off" : "crt-led"} />
          </div>
        </div>

        {/* Character display */}
        <div className="flex-shrink-0 flex flex-col items-center py-5 sm:py-8 px-5">
          {imageUrl ? (
            <div className="relative">
              <div className="absolute -inset-4 rounded-2xl bg-[var(--crt-green)]/[0.04] blur-2xl" />
              <img
                src={imageUrl}
                alt={objectName}
                className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-xl object-cover crt-image crt-rgb-shift border border-[var(--crt-green)]/20 ${
                  status === "playing" ? "wobble-eyes" : ""
                }`}
              />
            </div>
          ) : (
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl border border-[var(--crt-green)]/20 flex items-center justify-center">
              <span className="crt-text font-mono text-3xl">?</span>
            </div>
          )}
          <p className="crt-text font-mono text-sm sm:text-base mt-3 tracking-wide">
            {objectName}
          </p>
          {messages.length === 0 && status === "idle" && (
            <p className="crt-text-dim font-mono text-[10px] mt-1.5 tracking-wider">
              HOLD BUTTON TO TRANSMIT
            </p>
          )}
        </div>

        {/* Separator */}
        <div className="mx-5 sm:mx-8 border-t border-[var(--crt-green)]/10" />

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 sm:px-8 py-3 space-y-2.5 min-h-0"
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className="font-mono text-[13px] sm:text-sm leading-[1.55]"
            >
              {msg.role === "assistant" ? (
                <div className="crt-text">
                  <span className="crt-text-dim text-[11px]">
                    {objectName.toUpperCase().slice(0, 8)}:{" "}
                  </span>
                  {msg.text}
                </div>
              ) : (
                <div className="crt-text-amber">
                  <span className="opacity-60 text-[11px]">YOU: </span>
                  {msg.text}
                </div>
              )}
            </div>
          ))}
          {status === "processing" && (
            <div className="flex items-center gap-[5px] font-mono crt-text">
              <span className="crt-text-dim text-[11px]">
                {objectName.toUpperCase().slice(0, 8)}:{" "}
              </span>
              <span className="inline-flex gap-[4px]">
                <span className="w-[5px] h-[5px] rounded-full bg-[var(--crt-green)] animate-bounce-dot" />
                <span
                  className="w-[5px] h-[5px] rounded-full bg-[var(--crt-green)] animate-bounce-dot"
                  style={{ animationDelay: "0.16s" }}
                />
                <span
                  className="w-[5px] h-[5px] rounded-full bg-[var(--crt-green)] animate-bounce-dot"
                  style={{ animationDelay: "0.32s" }}
                />
              </span>
            </div>
          )}
        </div>

        {/* Push-to-talk */}
        {status !== "ended" && (
          <div
            className="flex-shrink-0 px-5 sm:px-8 pt-3 flex flex-col items-center gap-2 border-t border-[var(--crt-green)]/10"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom, 20px), 20px)",
            }}
          >
            {error && (
              <p className="font-mono text-[11px] text-red-400 text-center">
                ERR: {error}
              </p>
            )}
            <button
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              disabled={status === "processing" || status === "playing"}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-20 border-2 ${
                status === "recording"
                  ? "border-red-400 bg-red-400/10 text-red-400 scale-110 shadow-[0_0_24px_rgba(248,113,113,0.25)]"
                  : "border-[var(--crt-green)]/40 bg-[var(--crt-green)]/5 crt-text hover:bg-[var(--crt-green)]/10 active:scale-110 active:border-red-400 active:text-red-400"
              }`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </button>
            <p className="font-mono text-[10px] crt-text-dim tracking-wider">
              {status === "recording" ? "RELEASE TO SEND" : "HOLD TO TALK"}
            </p>
          </div>
        )}

        {/* Ended state */}
        {status === "ended" && (
          <div
            className="flex-shrink-0 px-5 pt-5 flex flex-col items-center border-t border-[var(--crt-green)]/10"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom, 24px), 24px)",
            }}
          >
            <p className="font-mono text-[11px] crt-text-dim tracking-[0.3em]">
              — END TRANSMISSION —
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
