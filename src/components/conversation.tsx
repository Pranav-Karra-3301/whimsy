"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useCallback, useState } from "react";

interface ConversationProps {
  objectId: string;
  objectName: string;
  personality: string;
  voiceId: string;
  imageUrl?: string;
}

interface Message {
  role: "agent" | "user";
  text: string;
}

type Status = "idle" | "connecting" | "connected" | "ended";

function ConversationInner({
  objectId,
  objectName,
  personality,
  imageUrl,
}: ConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const conversation = useConversation({
    onConnect: () => {
      console.log("[ElevenLabs] Connected");
      setStatus("connected");
    },
    onDisconnect: (details) => {
      console.log("[ElevenLabs] Disconnected:", JSON.stringify(details));
      setStatus("ended");
      if (objectId) {
        fetch(`/api/objects/${objectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ increment_talk: true }),
        });
      }
    },
    onError: (err) => {
      console.error("[ElevenLabs] Error:", err);
      setError(typeof err === "string" ? err : "Connection failed.");
      setStatus("ended");
    },
    onMessage: (msg) => {
      if (msg.source === "ai" && msg.message) {
        setMessages((prev) => [...prev, { role: "agent", text: msg.message }]);
      } else if (msg.source === "user" && msg.message) {
        setMessages((prev) => [...prev, { role: "user", text: msg.message }]);
      }
    },
  });

  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "";

  const start = useCallback(async () => {
    if (!agentId) {
      setError("ElevenLabs agent not configured.");
      return;
    }

    setError("");
    setMessages([]);

    // Get mic permission first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access is required.");
      return;
    }

    // Show connecting screen immediately
    setStatus("connecting");

    // Start session with only dynamicVariables (no overrides — avoids
    // agent security rejections)
    conversation.startSession({
      agentId,
      dynamicVariables: {
        object_name: objectName,
        personality,
      },
    });
  }, [conversation, objectName, personality, agentId]);

  const stop = useCallback(() => {
    conversation.endSession();
  }, [conversation]);

  const close = useCallback(() => {
    setStatus("idle");
    setMessages([]);
    setError("");
  }, []);

  // Idle — show start button
  if (status === "idle") {
    return (
      <div className="space-y-3">
        <button
          onClick={start}
          className="w-full py-3.5 rounded-2xl bg-accent text-bg font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Talk to {objectName}
        </button>
        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}
      </div>
    );
  }

  // Voice mode screen (connecting / connected / ended)
  const statusText =
    status === "connecting"
      ? "Connecting..."
      : status === "ended"
        ? "Conversation ended"
        : conversation.isSpeaking
          ? `${objectName} is speaking...`
          : "Listening...";

  return (
    <div className="fixed inset-0 z-50 bg-bg flex flex-col fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 safe-top">
        {status === "ended" ? (
          <button
            onClick={close}
            className="px-4 py-2 rounded-xl bg-accent text-bg text-sm font-semibold hover:opacity-90 transition-colors"
          >
            Done
          </button>
        ) : (
          <button
            onClick={stop}
            disabled={status === "connecting"}
            className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-sm hover:bg-white/[0.1] transition-colors disabled:opacity-50"
          >
            End
          </button>
        )}
        <p className="text-sm text-muted font-medium">{statusText}</p>
        <div className="w-16" />
      </div>

      {/* Character */}
      <div className="flex-shrink-0 flex justify-center px-8 pt-4 pb-3">
        {imageUrl ? (
          <div className="relative">
            <img
              src={imageUrl}
              alt={objectName}
              className={`w-36 h-36 rounded-3xl object-cover bg-white ${
                conversation.isSpeaking ? "wobble-eyes" : ""
              }`}
            />
            {status === "connected" && (
              <div className="absolute -bottom-1 -right-1">
                <div className="relative flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-accent" />
                  <div className="absolute w-3 h-3 rounded-full bg-accent pulse-ring" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-36 h-36 rounded-3xl bg-white/10 flex items-center justify-center text-5xl">
            👀
          </div>
        )}
      </div>

      <p className="text-center text-lg font-bold px-4 pb-2">{objectName}</p>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === "agent"
                ? "bg-white/[0.06] mr-auto"
                : "bg-accent/20 ml-auto text-right"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {messages.length === 0 && status === "connecting" && (
          <div className="flex flex-col items-center gap-3 pt-12">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <p className="text-sm text-muted">Connecting...</p>
          </div>
        )}
        {messages.length === 0 && status === "connected" && (
          <p className="text-center text-sm text-muted pt-12">
            Say something...
          </p>
        )}
      </div>

      {error && (
        <div className="px-4 pb-4">
          <p className="text-sm text-red-400 text-center">{error}</p>
        </div>
      )}
    </div>
  );
}

export function Conversation(props: ConversationProps) {
  return (
    <ConversationProvider>
      <ConversationInner {...props} />
    </ConversationProvider>
  );
}
