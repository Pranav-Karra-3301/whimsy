"use client";

import { useConversation } from "@elevenlabs/react";
import { useCallback, useState } from "react";

interface ConversationProps {
  objectId: string;
  objectName: string;
  personality: string;
  voiceId: string;
}

export function Conversation({
  objectId,
  objectName,
  personality,
  voiceId,
}: ConversationProps) {
  const [started, setStarted] = useState(false);

  const conversation = useConversation({
    onConnect: () => console.log("Connected"),
    onDisconnect: () => {
      setStarted(false);
      if (objectId) {
        fetch(`/api/objects/${objectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ increment_talk: true }),
        });
      }
    },
    onError: (error) => console.error("Conversation error:", error),
  });

  const start = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "",
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
      setStarted(true);
    } catch (error) {
      console.error("Failed to start:", error);
    }
  }, [conversation, objectName, personality, voiceId]);

  const stop = useCallback(async () => {
    await conversation.endSession();
    setStarted(false);
  }, [conversation]);

  if (!started) {
    return (
      <button
        onClick={start}
        className="w-full py-3.5 rounded-2xl bg-accent text-bg font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
      >
        Talk to {objectName}
      </button>
    );
  }

  return (
    <div className="space-y-4 fade-in">
      <button
        onClick={stop}
        className="w-full py-3.5 rounded-2xl bg-white/[0.06] border border-white/10 text-sm font-semibold hover:bg-white/[0.1] active:scale-[0.98] transition-all"
      >
        End conversation
      </button>
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="relative flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <div className="absolute w-3 h-3 rounded-full bg-accent pulse-ring" />
        </div>
        <p className="text-sm text-muted">
          {conversation.isSpeaking
            ? `${objectName} is speaking...`
            : "Listening..."}
        </p>
      </div>
    </div>
  );
}
