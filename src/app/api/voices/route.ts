import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("health") === "true") {
    return NextResponse.json({
      status: "ok",
      endpoint: "/api/voices",
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    });
  }

  const pageSize = searchParams.get("page_size") || "20";
  const search = searchParams.get("search") || "";

  try {
    const url = new URL("https://api.elevenlabs.io/v2/voices");
    url.searchParams.set("page_size", pageSize);
    if (search) url.searchParams.set("search", search);

    const res = await fetch(url.toString(), {
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ElevenLabs API error: ${res.status} ${text}`);
    }

    const data = await res.json();

    const voices = (data.voices ?? []).map(
      (v: { voice_id: string; name: string; labels?: Record<string, string>; preview_url?: string }) => ({
        voice_id: v.voice_id,
        name: v.name,
        labels: v.labels,
        preview_url: v.preview_url,
      })
    );

    return NextResponse.json({ voices, has_more: data.has_more ?? false });
  } catch (error) {
    console.error("Voices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch voices" },
      { status: 500 }
    );
  }
}
