import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/chat",
    gemini: !!process.env.GEMINI_API_KEY,
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { audio, history, character, voiceId } = await req.json();

    if (!audio || !character?.name || !character?.personality) {
      return NextResponse.json(
        { error: "audio, character.name, and character.personality are required" },
        { status: 400 }
      );
    }

    // Build conversation history for Gemini
    const contents: { role: string; parts: { text: string }[] }[] = [];

    if (history?.length) {
      for (const msg of history as ChatMessage[]) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.text }],
        });
      }
    }

    // Add current user audio as the latest message
    contents.push({
      role: "user",
      parts: [
        {
          inlineData: {
            data: audio,
            mimeType: "audio/webm",
          },
        },
        { text: "Transcribe what I said and respond in character." },
      ] as unknown as { text: string }[],
    });

    // Call Gemini — transcribe audio + generate response
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents,
      config: {
        systemInstruction: `You are ${character.name}. ${character.personality}

IMPORTANT RULES:
- Stay in character at all times
- Keep responses short — 1 to 3 sentences max
- Be funny, expressive, and entertaining
- The user is speaking to you via audio. First transcribe what they said, then respond.
- Format your response EXACTLY as:
HEARD: [what the user said]
RESPONSE: [your in-character response]`,
      },
    });

    const text = response.text ?? "";

    // Parse the response
    const heardMatch = text.match(/HEARD:\s*(.+?)(?:\n|RESPONSE:)/);
    const responseMatch = text.match(/RESPONSE:\s*([\s\S]+)/);

    const transcript = heardMatch?.[1]?.trim() || "";
    const characterResponse = responseMatch?.[1]?.trim() || text.trim();

    // Generate TTS audio via ElevenLabs
    let audioBase64 = "";
    if (voiceId && process.env.ELEVENLABS_API_KEY) {
      try {
        const ttsRes = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: "POST",
            headers: {
              "xi-api-key": process.env.ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
              Accept: "audio/mpeg",
            },
            body: JSON.stringify({
              text: characterResponse,
              model_id: "eleven_multilingual_v2",
            }),
          }
        );

        if (ttsRes.ok) {
          const audioBuffer = await ttsRes.arrayBuffer();
          audioBase64 = Buffer.from(audioBuffer).toString("base64");
        }
      } catch (e) {
        console.error("TTS error:", e);
      }
    }

    return NextResponse.json({
      transcript,
      response: characterResponse,
      audio: audioBase64,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}
