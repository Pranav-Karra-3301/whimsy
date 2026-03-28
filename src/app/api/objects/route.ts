import { NextRequest, NextResponse } from "next/server";
import { getAllObjects, createObject } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("health") === "true") {
    return NextResponse.json({
      status: "ok",
      endpoint: "/api/objects",
      spacetimedb: !!process.env.SPACETIMEDB_TOKEN,
    });
  }

  try {
    const objects = await getAllObjects();
    return NextResponse.json(objects);
  } catch (error) {
    console.error("List objects error:", error);
    return NextResponse.json(
      { error: "Failed to list objects" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, personality, backstory, voice_description, image_url, original_image_url, voice_id, voice_name } = body;

    if (!name || !personality || !image_url) {
      return NextResponse.json(
        { error: "name, personality, and image_url are required" },
        { status: 400 }
      );
    }

    const object = await createObject({
      name,
      personality,
      backstory: backstory || "",
      voice_description: voice_description || "",
      image_url,
      original_image_url: original_image_url || "",
      voice_id: voice_id || "",
      voice_name: voice_name || "",
    });

    return NextResponse.json(object, { status: 201 });
  } catch (error) {
    console.error("Create object error:", error);
    return NextResponse.json(
      { error: "Failed to create object" },
      { status: 500 }
    );
  }
}
