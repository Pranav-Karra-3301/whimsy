import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateGooglyImage(
  imageBase64: string,
  objectName?: string
): Promise<Buffer> {
  const subject = objectName ? `the ${objectName}` : "the main object";

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
            text: `Add two large cartoon googly eyes and a small cute cartoon mouth directly onto ${subject} in this photo. Keep everything else exactly the same — same background, same lighting, same composition. Only add the eyes and mouth. The eyes should be round, white with black pupils, slightly different sizes for a fun look. The mouth should be small and cute. Make it look funny and whimsical.`,
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
