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
        className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
      >
        Talk to {objectName}
      </button>
    );
  }

  const statusText =
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
    <div className="fixed inset-0 z-50 bg-bg flex flex-col fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        {status === "ended" ? (
          <button
            onClick={close}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-colors"
          >
            Done
          </button>
        ) : (
          <button
            onClick={endConversation}
            className="px-4 py-2 rounded-xl bg-surface border border-border text-sm hover:bg-surface-hover transition-colors shadow-sm"
          >
            End
          </button>
        )}
        <p className="text-sm text-muted font-medium">{statusText}</p>
        <div className="w-16" />
      </div>

      {/* Character */}
      <div className="flex-shrink-0 flex justify-center pt-4 pb-2">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={objectName}
            className={`w-44 h-44 rounded-3xl object-cover shadow-lg ${
              status === "playing" ? "wobble-eyes" : ""
            }`}
          />
        ) : (
          <div className="w-44 h-44 rounded-3xl bg-surface-hover border border-border flex items-center justify-center text-5xl">
            📷
          </div>
        )}
      </div>
      <p className="text-center text-lg font-bold pb-3">{objectName}</p>

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-4 space-y-3"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === "assistant"
                ? "bg-surface border border-border shadow-sm mr-auto"
                : "bg-primary-light ml-auto text-right"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {status === "processing" && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface border border-border shadow-sm mr-auto max-w-[85%]">
            <div className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse" />
            <div
              className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
        )}
      </div>

      {/* Push-to-talk */}
      {status !== "ended" && (
        <div className="flex-shrink-0 px-4 pb-8 pt-2 flex flex-col items-center gap-2">
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
          <button
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            disabled={status === "processing" || status === "playing"}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-40 ${
              status === "recording"
                ? "bg-red-500 scale-110 text-white"
                : "bg-primary text-white hover:opacity-90 active:scale-110 active:bg-red-500"
            }`}
          >
            <svg
              width="28"
              height="28"
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
          <p className="text-xs text-muted">
            {status === "recording" ? "Release to send" : "Hold to talk"}
          </p>
        </div>
      )}
    </div>
  );
}
