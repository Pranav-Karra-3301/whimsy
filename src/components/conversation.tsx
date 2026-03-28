"use client";

import { useConversation } from "@elevenlabs/react";
import { useCallback, useState, useEffect } from "react";

interface ConversationProps {
  objectId: string;
  objectName: string;
  personality: string;
  voiceId?: string;
}

export function Conversation({
  objectId,
  objectName,
  personality,
  voiceId,
}: ConversationProps) {
  const [started, setStarted] = useState(false);

  const conversation = useConversation({
    onConnect: () => console.log("Connected to ElevenLabs"),
    onDisconnect: () => {
      setStarted(false);
      // Increment talk count
      fetch(`/api/objects/${objectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment_talk: true }),
      });
    },
    onError: (error) => console.error("ElevenLabs error:", error),
  });

  const start = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "",
        dynamicVariables: {
          object_name: objectName,
          personality: personality,
        },
      });
      setStarted(true);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  }, [conversation, objectName, personality]);

  const stop = useCallback(async () => {
    await conversation.endSession();
    setStarted(false);
  }, [conversation]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {!started ? (
          <button
            onClick={start}
            className="flex-1 py-3 rounded-lg bg-accent text-bg font-mono font-bold text-sm hover:opacity-90 transition-opacity"
          >
            talk to {objectName}
          </button>
        ) : (
          <button
            onClick={stop}
            className="flex-1 py-3 rounded-lg bg-red-500/80 text-white font-mono font-bold text-sm hover:opacity-90 transition-opacity"
          >
            end conversation
          </button>
        )}
      </div>

      {started && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="relative">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <div className="absolute inset-0 w-4 h-4 rounded-full bg-red-500 pulse-ring" />
          </div>
          <p className="text-sm text-muted font-mono">
            {conversation.isSpeaking ? `${objectName} is speaking...` : "listening..."}
          </p>
        </div>
      )}
    </div>
  );
}
