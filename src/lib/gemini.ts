import { GoogleGenAI } from "@google/genai";
import type { IdentifyResponse } from "@/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const IDENTIFY_PROMPT = [
  "You are looking at a photo of an object. Identify it and give it a fun, quirky personality as if it were an NPC in a video game.",
  "",
  "Return ONLY valid JSON with these fields:",
  "{",
  '  "name": "A fun character name for this object (e.g. Sir Mugsworth for a coffee mug)",',
  '  "personality": "A detailed personality description and speaking style. Be creative and funny. Write as system prompt instructions for a conversational AI.",',
  '  "backstory": "A short 2-3 sentence backstory for this character",',
  '  "voice_description": "A short description of what this characters voice should sound like (e.g. deep gravelly voice, high-pitched excited voice, calm soothing whisper)"',
  "}",
].join("\n");

export async function identifyObject(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<IdentifyResponse> {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType,
            },
          },
          { text: IDENTIFY_PROMPT },
        ],
      },
    ],
  });

  const text = response.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Gemini response as JSON");
  }

  return JSON.parse(jsonMatch[0]) as IdentifyResponse;
}
