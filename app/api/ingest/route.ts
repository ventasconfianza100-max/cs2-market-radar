import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Recibe snapshots del recolector (scripts/collector.mjs corriendo en un
// PC con acceso a CSFloat) y los guarda en Vercel Blob para que el sitio
// los sirva aunque CSFloat bloquee las IPs de Vercel.

export async function POST(req: Request) {
  const secret = process.env.INGEST_SECRET;
  if (!secret || req.headers.get("x-ingest-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "blob_not_configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const items = (body as { items?: unknown[] })?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items_required" }, { status: 400 });
  }

  const snapshot = { items, updatedAt: new Date().toISOString() };
  try {
    const blob = await put("radar/snapshot.json", JSON.stringify(snapshot), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json"
    });
    return NextResponse.json({ ok: true, url: blob.url, count: items.length });
  } catch (e) {
    return NextResponse.json(
      { error: "blob_write_failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
