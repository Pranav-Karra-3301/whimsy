import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateGooglyImage(
  imageBase64: string,
  objectName?: string
): Promise<Buffer> {
  const subject = objectName ? `this ${objectName}` : "the main object in this photo";

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: "image/jpeg",
            },
          },
          {
            text: `Transform ${subject} into a fun cartoon character. Extract it from the background and place it on a clean white background. Add two large realistic-looking googly eyes — round, white, with glossy black pupils, slightly different sizes for a goofy look. Add a small cute expressive mouth. Add tiny cartoon arms and legs if appropriate. Make it look like a real toy or collectible figurine — a funny, endearing NPC character with personality. Keep the object recognizable but make it charming and alive.`,
          },
        ],
      },
    ],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData) {
      return Buffer.from(part.inlineData.data!, "base64");
    }
  }

  throw new Error("No image returned from Nano Banana 2");
}
