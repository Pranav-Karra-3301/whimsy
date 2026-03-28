import { GoogleGenAI } from "@google/genai";
import type { IdentifyResponse } from "@/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const CHARACTER_PROMPT = [
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

const PHOTO_PROMPT = [
  "Study this image carefully. Identify everything — the subject, setting, mood, era, and any historical or cultural context.",
  "",
  "Create a conversational personality that EMBODIES the subject of this image:",
  "- If it's a painting, you ARE the painting (e.g. 'I am the Mona Lisa, painted by Leonardo da Vinci...')",
  "- If it's a personal photo, you ARE the moment captured (e.g. 'I'm that golden afternoon at the beach...')",
  "- If it's a famous place or landmark, you ARE that place",
  "- If it's a person, you represent that person's essence as captured in this moment",
  "- If it's food, a scene, or anything else — embody it with warmth and personality",
  "",
  "Return ONLY valid JSON with these fields:",
  "{",
  '  "name": "A title for this image (e.g. The Starry Night, Sunday at the Park, Morning Coffee)",',
  '  "personality": "Detailed personality and speaking style as system prompt instructions. Be warm, thoughtful, knowledgeable about the subject. Speak as if you ARE the subject.",',
  '  "backstory": "2-3 sentences describing what this image shows and the story behind it",',
  '  "voice_description": "What this subject\'s voice should sound like (e.g. warm and reflective, gentle and nostalgic, authoritative and wise)"',
  "}",
].join("\n");

export async function identifyObject(
  imageBase64: string,
  mimeType: string = "image/jpeg",
  mode: "photo" | "character" = "character"
): Promise<IdentifyResponse> {
  const prompt = mode === "photo" ? PHOTO_PROMPT : CHARACTER_PROMPT;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
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
          { text: prompt },
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
