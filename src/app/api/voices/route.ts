import { NextRequest, NextResponse } from "next/server";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("health") === "true") {
    return NextResponse.json({
      status: "ok",
      endpoint: "/api/voices",
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    });
  }

  const limit = parseInt(searchParams.get("limit") || "18", 10);
  const search = searchParams.get("search") || "";

  try {
    // Fetch a large pool so we can shuffle and return a varied set each time
    const url = new URL("https://api.elevenlabs.io/v2/voices");
    url.searchParams.set("page_size", "100");
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

    const all = (data.voices ?? []).map(
      (v: { voice_id: string; name: string; labels?: Record<string, string>; preview_url?: string }) => ({
        voice_id: v.voice_id,
        name: v.name,
        labels: v.labels,
        preview_url: v.preview_url,
      })
    );

    // Shuffle and return a subset for variety
    const voices = shuffle(all).slice(0, limit);

    return NextResponse.json({ voices, total: all.length });
  } catch (error) {
    console.error("Voices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch voices" },
      { status: 500 }
    );
  }
}
