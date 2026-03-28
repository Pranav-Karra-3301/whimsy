import { NextRequest, NextResponse } from "next/server";
import { identifyObject } from "@/lib/gemini";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/identify",
    gemini: !!process.env.GEMINI_API_KEY,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType, mode } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const result = await identifyObject(image, mimeType || "image/jpeg", mode || "character");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Identify error:", error);
    return NextResponse.json(
      { error: "Failed to identify object" },
      { status: 500 }
    );
  }
}
