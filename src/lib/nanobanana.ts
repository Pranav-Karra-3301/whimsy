import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateGooglyImage(
  objectName: string,
  imageBase64: string
): Promise<Buffer> {
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
            text: `Add two large cartoon googly eyes and a small cute cartoon mouth to this ${objectName}. Keep the object recognizable. Fun, whimsical, kawaii style. White clean background.`,
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
