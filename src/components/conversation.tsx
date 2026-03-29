"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { CRTScreen } from "./crt-screen";

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
}: ConversationProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
  }, [messages, objectName, personality, voiceId]);

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

  // Build terminal text content for the CRT renderer
  const terminalText = useMemo(() => {
    const lines: string[] = [];
    const tag = objectName.toUpperCase().slice(0, 10);

    lines.push("");
    lines.push(`  WHIMSY CRT-V1                              ${status === "ended" ? "SIGNAL LOST" : status === "recording" ? "REC *" : "STANDBY"}`);
    lines.push("");
    lines.push(`  ${tag}`);
    lines.push("");

    if (messages.length === 0 && status === "idle") {
      lines.push("  Hold button to transmit...");
    }

    for (const msg of messages) {
      if (msg.role === "assistant") {
        // Word-wrap long messages
        const prefix = `  ${tag}: `;
        const wrapped = wordWrap(msg.text, 70 - prefix.length);
        lines.push(prefix + wrapped[0]);
        for (let i = 1; i < wrapped.length; i++) {
          lines.push(" ".repeat(prefix.length) + wrapped[i]);
        }
      } else {
        const prefix = "  YOU: ";
        const wrapped = wordWrap(msg.text, 70 - prefix.length);
        lines.push(prefix + wrapped[0]);
        for (let i = 1; i < wrapped.length; i++) {
          lines.push(" ".repeat(prefix.length) + wrapped[i]);
        }
      }
      lines.push("");
    }

    if (status === "processing") {
      lines.push(`  ${tag}: ...`);
    }

    if (error) {
      lines.push(`  ERR: ${error}`);
    }

    if (status === "ended") {
      lines.push("");
      lines.push("  -- END TRANSMISSION --");
    }

    return lines.join("\n");
  }, [messages, status, objectName, error]);

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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* WebGL CRT canvas — fills entire screen */}
      <CRTScreen text={terminalText} />

      {/* Interactive overlay — buttons on top of the CRT */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        {/* Top controls */}
        <div className="flex items-center justify-between px-8 sm:px-12 pt-8 sm:pt-10">
          {status === "ended" ? (
            <button
              onClick={close}
              className="pointer-events-auto font-mono text-xs text-[#0ccc68] opacity-0 hover:opacity-100 transition-opacity cursor-pointer px-3 py-1.5"
            >
              [EXIT]
            </button>
          ) : (
            <button
              onClick={endConversation}
              className="pointer-events-auto font-mono text-xs text-[#0a7a3e] hover:text-[#0ccc68] transition-colors cursor-pointer px-3 py-1.5"
            >
              [END]
            </button>
          )}
          <div />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom controls */}
        {status !== "ended" && (
          <div className="flex flex-col items-center gap-3 pb-10 sm:pb-14">
            <button
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              disabled={status === "processing" || status === "playing"}
              className={`pointer-events-auto w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-20 border-2 ${
                status === "recording"
                  ? "border-red-400 bg-red-400/10 text-red-400 scale-110 shadow-[0_0_24px_rgba(248,113,113,0.25)]"
                  : "border-[#0ccc68]/40 bg-[#0ccc68]/5 text-[#0ccc68] hover:bg-[#0ccc68]/10 active:scale-110 active:border-red-400 active:text-red-400"
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
            <p className="font-mono text-[10px] text-[#0a7a3e] tracking-wider">
              {status === "recording" ? "RELEASE TO SEND" : "HOLD TO TALK"}
            </p>
          </div>
        )}

        {status === "ended" && (
          <div className="flex flex-col items-center pb-12">
            <button
              onClick={close}
              className="pointer-events-auto font-mono text-sm text-[#0ccc68] px-6 py-2 border border-[#0ccc68]/30 rounded hover:bg-[#0ccc68]/10 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Simple word-wrap utility */
function wordWrap(text: string, maxWidth: number): string[] {
  if (text.length <= maxWidth) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length + word.length + 1 > maxWidth && current.length > 0) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
