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
      ? "Listening..."
      : status === "processing"
        ? "Thinking..."
        : status === "playing"
          ? `${objectName} is speaking...`
          : status === "ended"
            ? "Conversation ended"
            : "Tap and hold to talk";

  return (
    <div className="fixed inset-0 z-50 flex flex-col fade-in overflow-hidden">
      {/* Background: blurred, dimmed photo */}
      {imageUrl && (
        <div className="absolute inset-0 z-0">
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover scale-110 blur-[40px]"
          />
          <div className="absolute inset-0 bg-black/65" />
          {/* Warm color wash for nostalgia */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 via-transparent to-black/30" />
        </div>
      )}
      {/* Fallback if no image */}
      {!imageUrl && <div className="absolute inset-0 z-0 bg-[#0D0D0C]" />}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)] pb-3">
        {status === "ended" ? (
          <button
            onClick={close}
            className="px-5 py-2 rounded-full bg-white/90 backdrop-blur-sm text-[#1A1917] text-sm font-medium hover:bg-white transition-colors"
          >
            Done
          </button>
        ) : (
          <button
            onClick={endConversation}
            className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/[0.06] text-white/70 text-sm font-medium hover:bg-white/15 transition-colors"
          >
            End
          </button>
        )}
        <p className="text-[13px] text-white/40 font-medium tracking-wide">
          {statusLabel}
        </p>
        <div className="w-16" />
      </div>

      {/* Character — floating over the blurred background */}
      <div className="relative z-10 flex-shrink-0 flex flex-col items-center pt-3 pb-3">
        {imageUrl ? (
          <div className="relative">
            {/* Soft glow behind the image */}
            <div
              className="absolute -inset-3 rounded-[28px] opacity-40 blur-xl"
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <img
              src={imageUrl}
              alt={objectName}
              className={`relative w-28 h-28 rounded-2xl object-cover ring-1 ring-white/15 ${
                status === "playing" ? "wobble-eyes" : ""
              }`}
            />
          </div>
        ) : (
          <div className="w-28 h-28 rounded-2xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center text-3xl">
            📷
          </div>
        )}
        <p className="font-display text-lg text-white/90 mt-3">
          {objectName}
        </p>
        {messages.length === 0 && status === "idle" && (
          <p className="text-[12px] text-white/30 mt-1">
            Hold the button below to start talking
          </p>
        )}
      </div>

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="relative z-10 flex-1 overflow-y-auto px-4 pb-4 space-y-2.5"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[80%] animate-[fade-in_0.25s_ease-out] ${
              msg.role === "user" ? "ml-auto" : "mr-auto"
            }`}
          >
            <div
              className={`px-[14px] py-[10px] text-[15px] leading-[1.45] ${
                msg.role === "assistant"
                  ? "bg-white/[0.12] backdrop-blur-md rounded-[18px] rounded-bl-[4px] text-white/85 border border-white/[0.06]"
                  : "bg-white/90 rounded-[18px] rounded-br-[4px] text-[#1A1917]"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {status === "processing" && (
          <div className="max-w-[80%] mr-auto">
            <div className="inline-flex items-center gap-[5px] px-[14px] py-[12px] bg-white/[0.12] backdrop-blur-md rounded-[18px] rounded-bl-[4px] border border-white/[0.06]">
              <div className="w-[6px] h-[6px] rounded-full bg-white/40 animate-bounce-dot" />
              <div
                className="w-[6px] h-[6px] rounded-full bg-white/40 animate-bounce-dot"
                style={{ animationDelay: "0.16s" }}
              />
              <div
                className="w-[6px] h-[6px] rounded-full bg-white/40 animate-bounce-dot"
                style={{ animationDelay: "0.32s" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Push-to-talk */}
      {status !== "ended" && (
        <div className="relative z-10 flex-shrink-0 px-4 pb-[max(env(safe-area-inset-bottom),32px)] pt-3 flex flex-col items-center gap-3">
          {error && (
            <p className="text-[13px] text-red-400/90 text-center">{error}</p>
          )}
          <button
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            disabled={status === "processing" || status === "playing"}
            className={`w-[64px] h-[64px] rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 ${
              status === "recording"
                ? "bg-red-500 scale-110 text-white shadow-[0_0_30px_rgba(239,68,68,0.35)]"
                : "bg-white/90 backdrop-blur-sm text-[#1A1917] hover:bg-white active:scale-110 active:bg-red-500 active:text-white"
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
          <p className="text-[11px] text-white/25 tracking-wide">
            {status === "recording" ? "Release to send" : "Hold to talk"}
          </p>
        </div>
      )}

      {/* Ended state — fade out bottom area */}
      {status === "ended" && (
        <div className="relative z-10 flex-shrink-0 px-4 pb-[max(env(safe-area-inset-bottom),32px)] pt-6 flex flex-col items-center">
          <p className="text-[13px] text-white/30 font-display">
            Until next time
          </p>
        </div>
      )}
    </div>
  );
}
