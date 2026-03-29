"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CRTScreen } from "./crt-screen";

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

/** Simple word-wrap */
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
        if (!text) return;

        if (role === "user") sawUserRef.current = true;
        else sawAssistantRef.current = true;

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
    if (!objectId || countedRef.current || !sawUserRef.current || !sawAssistantRef.current)
      return;
    countedRef.current = true;
    void fetch(`/api/objects/${objectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ increment_talk: true }),
    });
  }, [objectId]);

  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { endedRef.current = status === "ended"; }, [status]);

  useEffect(() => {
    if (status === "ended" || !open) return;
    if (sessionStatus === "connecting") { setStatus("connecting"); return; }
    if (sessionStatus === "error") { setStatus("idle"); return; }
    if (sessionStatus !== "connected") { setStatus("idle"); return; }
    if (!micMuted) { setStatus("recording"); return; }
    if (isSpeaking) { setStatus("playing"); return; }
    if (messages[messages.length - 1]?.role === "user") { setStatus("processing"); return; }
    setStatus("idle");
  }, [isSpeaking, messages, micMuted, open, sessionStatus, status]);

  useEffect(() => {
    if (sessionStatus === "error" && message) setError(message);
  }, [message, sessionStatus]);

  const openConversation = useCallback(() => {
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
        ...(voiceId ? { tts: { voiceId } } : {}),
      },
    });
  }, [backstory, objectName, personality, setMicMuted, startSession, voiceId]);

  const handlePressStart = useCallback(() => {
    if (sessionStatus !== "connected") return;
    setError("");
    setMicMuted(false);
  }, [sessionStatus, setMicMuted]);

  const handlePressEnd = useCallback(() => {
    if (sessionStatus !== "connected") return;
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
    setMicMuted(true);
    endedRef.current = false;
    setOpen(false);
    setStatus("idle");
    setMessages([]);
    setError("");
    endSession();
  }, [endSession, persistTalkCount, setMicMuted]);

  // Build terminal text for the CRT renderer
  const terminalText = useMemo(() => {
    const tag = objectName.toUpperCase().slice(0, 10);
    const statusStr =
      status === "recording" ? "REC *"
      : status === "connecting" ? "CONNECTING..."
      : status === "processing" ? "PROCESSING..."
      : status === "playing" ? "PLAYING..."
      : status === "ended" ? "SIGNAL LOST"
      : "STANDBY";

    const lines: string[] = [];
    lines.push("");
    lines.push(`  WHIMSY CRT-V1                         ${statusStr}`);
    lines.push("");
    lines.push(`  ${tag}`);
    lines.push("");

    if (messages.length === 0 && (status === "idle" || status === "connecting")) {
      lines.push(status === "connecting" ? "  Connecting to agent..." : "  Hold button to transmit...");
    }

    for (const msg of messages) {
      const prefix = msg.role === "assistant" ? `  ${tag}: ` : "  YOU: ";
      const wrapped = wordWrap(msg.text, 68 - prefix.length);
      lines.push(prefix + wrapped[0]);
      for (let i = 1; i < wrapped.length; i++) {
        lines.push(" ".repeat(prefix.length) + wrapped[i]);
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
        onClick={openConversation}
        className="w-full py-4 rounded-full bg-primary text-white font-medium text-sm tracking-apple hover:bg-primary-hover active:scale-[0.98] transition-all shadow-card-hover"
      >
        Talk to {objectName}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Full-screen WebGL CRT canvas */}
      <CRTScreen text={terminalText} />

      {/* Interactive overlay on top of WebGL */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        {/* Top — end/exit button */}
        <div className="flex items-center px-8 sm:px-12 pt-8 sm:pt-10">
          {status === "ended" ? (
            <button
              onClick={close}
              className="pointer-events-auto font-mono text-xs text-[#0ccc68]/60 hover:text-[#0ccc68] transition-colors cursor-pointer px-3 py-1.5"
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
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom — push-to-talk */}
        {status !== "ended" && (
          <div className="flex flex-col items-center gap-3 pb-10 sm:pb-14">
            {error && (
              <p className="font-mono text-[11px] text-red-400 text-center pointer-events-auto">
                {error}
              </p>
            )}
            <button
              onPointerDown={handlePressStart}
              onPointerUp={handlePressEnd}
              onPointerCancel={handlePressEnd}
              onPointerLeave={handlePressEnd}
              disabled={sessionStatus !== "connected"}
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
              {status === "connecting"
                ? "CONNECTING..."
                : status === "recording"
                  ? "RELEASE TO SEND"
                  : "HOLD TO TALK"}
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
          Missing NEXT_PUBLIC_ELEVENLABS_AGENT_ID
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
