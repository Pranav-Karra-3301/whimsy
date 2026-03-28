"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useCallback, useState } from "react";

interface ConversationProps {
  objectId: string;
  objectName: string;
  personality: string;
  voiceId: string;
  imageUrl?: string;
  onEnd?: () => void;
}

interface Message {
  role: "agent" | "user";
  text: string;
}

function ConversationInner({
  objectId,
  objectName,
  personality,
  voiceId,
  imageUrl,
  onEnd,
}: ConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");

  const conversation = useConversation({
    onConnect: () => setStarted(true),
    onDisconnect: () => {
      setStarted(false);
      if (objectId) {
        fetch(`/api/objects/${objectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ increment_talk: true }),
        });
      }
      onEnd?.();
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      setError("Connection failed. Check your microphone permissions.");
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
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access denied.");
      return;
    }
    conversation.startSession({
      agentId,
      dynamicVariables: {
        object_name: objectName,
        personality,
      },
      overrides: {
        agent: {
          prompt: {
            prompt: `You are ${objectName}, a fun NPC character. ${personality}`,
          },
          firstMessage: `Hey there! I'm ${objectName}! What's up?`,
        },
        tts: {
          voiceId,
        },
      },
    });
  }, [conversation, objectName, personality, voiceId, agentId]);

  const stop = useCallback(() => {
    conversation.endSession();
  }, [conversation]);

  // Not started yet — show start button
  if (!started && messages.length === 0) {
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

  // Voice mode screen
  return (
    <div className="fixed inset-0 z-50 bg-bg flex flex-col fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={stop}
          className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-sm hover:bg-white/[0.1] transition-colors"
        >
          End
        </button>
        <p className="text-sm text-muted font-medium">
          {conversation.isSpeaking ? "Speaking..." : started ? "Listening..." : "Ended"}
        </p>
        <div className="w-16" />
      </div>

      {/* Character image */}
      <div className="flex-shrink-0 flex justify-center px-8 pt-2 pb-4">
        {imageUrl ? (
          <div className="relative">
            <img
              src={imageUrl}
              alt={objectName}
              className={`w-32 h-32 rounded-3xl object-cover bg-white ${
                conversation.isSpeaking ? "wobble-eyes" : ""
              }`}
            />
            {started && (
              <div className="absolute -bottom-1 -right-1">
                <div className="relative flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-accent" />
                  <div className="absolute w-3 h-3 rounded-full bg-accent pulse-ring" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-32 h-32 rounded-3xl bg-white/10 flex items-center justify-center text-4xl">
            👀
          </div>
        )}
      </div>

      <p className="text-center text-lg font-bold px-4">{objectName}</p>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
              msg.role === "agent"
                ? "bg-white/[0.06] self-start mr-auto"
                : "bg-accent/20 self-end ml-auto text-right"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {messages.length === 0 && started && (
          <p className="text-center text-sm text-muted pt-8">
            Start talking...
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
