import { NextRequest, NextResponse } from "next/server";
import { identifyObject } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const result = await identifyObject(image, mimeType || "image/jpeg");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Identify error:", error);
    return NextResponse.json(
      { error: "Failed to identify object" },
      { status: 500 }
    );
  }
}
