import { NextResponse } from "next/server";
import { getItemByName } from "@/lib/data";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(_req: Request, { params }: { params: { name: string } }) {
  const item = await getItemByName(decodeURIComponent(params.name));
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ item });
}
