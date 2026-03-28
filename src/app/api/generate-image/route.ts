import { NextRequest, NextResponse } from "next/server";
import { generateGooglyImage } from "@/lib/nanobanana";
import { uploadToR2 } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/generate-image",
    gemini: !!process.env.GEMINI_API_KEY,
    r2: !!process.env.R2_ACCESS_KEY_ID,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { objectName, image, mode } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "image is required" },
        { status: 400 }
      );
    }

    // Photo mode: upload original directly, no transformation
    if (mode === "photo") {
      const buffer = Buffer.from(image, "base64");
      const key = `photos/${uuidv4()}.jpg`;
      const imageUrl = await uploadToR2(key, buffer, "image/jpeg");
      return NextResponse.json({ image_url: imageUrl });
    }

    // Character mode: generate googly-eyed image
    const imageBuffer = await generateGooglyImage(image, objectName);
    const key = `googly/${uuidv4()}.jpg`;
    const imageUrl = await uploadToR2(key, imageBuffer, "image/jpeg");

    return NextResponse.json({ image_url: imageUrl });
  } catch (error) {
    console.error("Generate image error:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
