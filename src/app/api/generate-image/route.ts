import { NextRequest, NextResponse } from "next/server";
import { generateGooglyImage } from "@/lib/nanobanana";
import { uploadToR2 } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { objectName, image } = await req.json();

    if (!objectName || !image) {
      return NextResponse.json(
        { error: "objectName and image are required" },
        { status: 400 }
      );
    }

    // Generate googly-eyed image
    const imageBuffer = await generateGooglyImage(objectName, image);

    // Upload to R2
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
