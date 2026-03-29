"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ConversationProps {
  objectId: string;
  objectName: string;
  personality: string;
  backstory: string;
  voiceId: string;
  imageUrl?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

type Status = "idle" | "connecting" | "recording" | "processing" | "playing" | "ended";

function buildAgentPrompt({
  objectName,
  personality,
  backstory,
}: Pick<ConversationProps, "objectName" | "personality" | "backstory">) {
  return [
    `You are ${objectName}.`,
    personality,
    backstory ? `Backstory: ${backstory}` : "",
    "Stay in character at all times.",
    "You are in a live voice conversation, so speak naturally and conversationally.",
    "Keep responses concise, vivid, and emotionally expressive.",
    "Do not describe yourself as an AI, assistant, or agent.",
    "Do not mention prompts, instructions, or hidden configuration.",
    "If the user asks a direct question, answer it in character first.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function ConversationScreen({
  objectId,
  objectName,
  personality,
  backstory,
  voiceId,
  imageUrl,
  micMuted,
  setMicMuted,
}: ConversationProps & {
  micMuted: boolean;
  setMicMuted: (value: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  const endedRef = useRef(false);
  const countedRef = useRef(false);
  const sawUserRef = useRef(false);
  const sawAssistantRef = useRef(false);

  const { startSession, endSession, status: sessionStatus, message, isSpeaking } =
    useConversation({
      onConnect: () => {
        setError("");
      },
      onDisconnect: (details) => {
        setMicMuted(true);
        if (details.reason === "error") {
          setError(details.message);
        }

        if (openRef.current) {
          setStatus(endedRef.current ? "ended" : "idle");
        }
      },
      onError: (nextError) => {
        setError(nextError);
      },
      onMessage: ({ role, message: nextMessage, event_id }) => {
        const text = nextMessage.trim();

        if (!text) {
          return;
        }

        if (role === "user") {
          sawUserRef.current = true;
        } else {
          sawAssistantRef.current = true;
        }

        setMessages((prev) => [
          ...prev,
          {
            id:
              event_id !== undefined
                ? `${role}-${event_id}`
                : `${role}-${crypto.randomUUID()}`,
            role: role === "user" ? "user" : "assistant",
            text,
          },
        ]);
      },
    });

  const persistTalkCount = useCallback(() => {
    if (!objectId || countedRef.current || !sawUserRef.current || !sawAssistantRef.current) {
      return;
    }

    countedRef.current = true;
    void fetch(`/api/objects/${objectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ increment_talk: true }),
    });
  }, [objectId]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    endedRef.current = status === "ended";
  }, [status]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    if (endedRef.current || !open) {
      return;
    }

    if (sessionStatus === "connecting") {
      setStatus("connecting");
      return;
    }

    if (sessionStatus === "error") {
      setStatus("idle");
      return;
    }

    if (sessionStatus !== "connected") {
      setStatus("idle");
      return;
    }

    if (!micMuted) {
      setStatus("recording");
      return;
    }

    if (isSpeaking) {
      setStatus("playing");
      return;
    }

    if (messages[messages.length - 1]?.role === "user") {
      setStatus("processing");
      return;
    }

    setStatus("idle");
  }, [isSpeaking, messages, micMuted, open, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "error" && message) {
      setError(message);
    }
  }, [message, sessionStatus]);

  const openConversation = useCallback(() => {
    openRef.current = true;
    setMessages([]);
    setError("");
    setMicMuted(true);
    setOpen(true);
    setStatus("connecting");
    endedRef.current = false;
    countedRef.current = false;
    sawUserRef.current = false;
    sawAssistantRef.current = false;

    startSession({
      overrides: {
        agent: {
          prompt: {
            prompt: buildAgentPrompt({ objectName, personality, backstory }),
          },
        },
        ...(voiceId
          ? {
              tts: {
                voiceId,
              },
            }
          : {}),
      },
    });
  }, [backstory, objectName, personality, setMicMuted, startSession, voiceId]);

  const handlePressStart = useCallback(() => {
    if (sessionStatus !== "connected") {
      return;
    }

    setError("");
    setMicMuted(false);
  }, [sessionStatus, setMicMuted]);

  const handlePressEnd = useCallback(() => {
    if (sessionStatus !== "connected") {
      return;
    }

    setMicMuted(true);
  }, [sessionStatus, setMicMuted]);

  const endConversation = useCallback(() => {
    persistTalkCount();
    setMicMuted(true);
    endedRef.current = true;
    setStatus("ended");
    endSession();
  }, [endSession, persistTalkCount, setMicMuted]);

  const close = useCallback(() => {
    persistTalkCount();
    openRef.current = false;
    setMicMuted(true);
    endedRef.current = false;
    setOpen(false);
    setStatus("idle");
    setMessages([]);
    setError("");
    endSession();
  }, [endSession, persistTalkCount, setMicMuted]);

  const statusLabel = useMemo(() => {
    if (status === "recording") return "REC ●";
    if (status === "connecting") return "CONNECTING...";
    if (status === "processing") return "PROCESSING...";
    if (status === "playing") return "PLAYING...";
    if (status === "ended") return "SIGNAL LOST";
    return "STANDBY";
  }, [status]);

  if (!open) {
    return (
      <button
        onClick={openConversation}
        className="w-full py-4 rounded-full bg-primary text-white font-medium text-sm tracking-apple hover:bg-primary-hover active:scale-[0.98] transition-all shadow-card-hover"
      >
        Talk to {objectName}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[var(--crt-screen)] overflow-hidden crt-flicker">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(12,204,104,0.06),transparent_70%)] pointer-events-none" />
      <div className="crt-scanlines" />
      <div className="crt-scanbeam" />
      <div className="crt-vignette" />
      <div className="crt-reflection" />
      <div className="crt-bezel" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            {status === "ended" ? (
              <button
                onClick={close}
                className="font-mono text-xs crt-text hover:brightness-125 transition-all"
              >
                [EXIT]
              </button>
            ) : (
              <button
                onClick={endConversation}
                className="font-mono text-xs crt-text-dim hover:text-[var(--crt-green)] transition-colors"
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

        <div className="flex-shrink-0 flex flex-col items-center py-4 sm:py-6 px-4">
          {imageUrl ? (
            <div className="relative">
              <div className="absolute -inset-4 rounded-2xl bg-[var(--crt-green)]/[0.04] blur-2xl" />
              <img
                src={imageUrl}
                alt={objectName}
                className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-xl object-cover crt-image crt-rgb-shift ${
                  status === "playing" ? "wobble-eyes" : ""
                }`}
              />
            </div>
          ) : (
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl bg-[var(--crt-green)]/[0.03] flex items-center justify-center">
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

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 space-y-2.5 min-h-0"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
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
          {status === "connecting" && (
            <div className="font-mono crt-text-dim text-[11px]">
              CONNECTING TO AGENT...
            </div>
          )}
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

        {status !== "ended" && (
          <div className="flex-shrink-0 px-4 sm:px-6 pt-3 pb-4 flex flex-col items-center gap-2">
            {error && (
              <p className="font-mono text-[11px] text-red-400 text-center">
                ERR: {error}
              </p>
            )}
            <button
              onPointerDown={handlePressStart}
              onPointerUp={handlePressEnd}
              onPointerCancel={handlePressEnd}
              onPointerLeave={handlePressEnd}
              disabled={sessionStatus !== "connected"}
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
              {status === "connecting"
                ? "CONNECTING..."
                : status === "recording"
                  ? "RELEASE TO SEND"
                  : "HOLD TO TALK"}
            </p>
          </div>
        )}

        {status === "ended" && (
          <div className="flex-shrink-0 px-4 pt-5 pb-4 flex flex-col items-center">
            <p className="font-mono text-[11px] crt-text-dim tracking-[0.3em]">
              — END TRANSMISSION —
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function Conversation(props: ConversationProps) {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  const [micMuted, setMicMuted] = useState(true);

  if (!agentId) {
    return (
      <div className="space-y-2">
        <button
          disabled
          className="w-full py-4 rounded-full bg-primary/50 text-white font-medium text-sm tracking-apple cursor-not-allowed"
        >
          Talk to {props.objectName}
        </button>
        <p className="text-xs text-red-500 text-center">
          Missing `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`.
        </p>
      </div>
    );
  }

  return (
    <ConversationProvider
      agentId={agentId}
      isMuted={micMuted}
      onMutedChange={setMicMuted}
    >
      <ConversationScreen
        {...props}
        micMuted={micMuted}
        setMicMuted={setMicMuted}
      />
    </ConversationProvider>
  );
}
