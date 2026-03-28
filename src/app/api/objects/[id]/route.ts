import { NextRequest, NextResponse } from "next/server";
import { getObjectById, updateObject, deleteObject, incrementTalkCount } from "@/lib/db";
import { deleteObjectImages } from "@/lib/r2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (id === "health") {
    return NextResponse.json({
      status: "ok",
      endpoint: "/api/objects/[id]",
      spacetimedb: !!process.env.SPACETIMEDB_TOKEN,
    });
  }

  const object = await getObjectById(id);
  if (!object) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(object);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  if (body.increment_talk) {
    const updated = await incrementTalkCount(id);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  }

  const updated = await updateObject(id, body);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Clean up R2 images before deleting the DB record
  const obj = await getObjectById(id);
  if (obj) {
    await deleteObjectImages(obj.image_url, obj.original_image_url).catch(
      (err) => console.error("Failed to delete R2 images:", err)
    );
  }

  const deleted = await deleteObject(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
