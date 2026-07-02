import { NextResponse } from "next/server";
import { getAnalyzedItems } from "@/lib/data";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // enriquecer con Steam toma varios segundos en frío

export async function GET() {
  const { items, demo } = await getAnalyzedItems();
  return NextResponse.json({ items, demo, fetchedAt: new Date().toISOString() });
}
