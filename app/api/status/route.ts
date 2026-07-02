import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Diagnóstico: verifica la conexión a CSFloat desde el servidor
// sin exponer la API key.

export async function GET() {
  const key = process.env.CSFLOAT_API_KEY;
  let csfloatStatus: number | string = "sin probar";
  try {
    const res = await fetch("https://csfloat.com/api/v1/listings?limit=1", {
      headers: key ? { Authorization: key } : undefined,
      cache: "no-store"
    });
    csfloatStatus = res.status;
  } catch (e) {
    csfloatStatus = e instanceof Error ? e.message : "error";
  }
  return NextResponse.json({
    hasKey: Boolean(key),
    keyLength: key?.length ?? 0,
    csfloatStatus,
    checkedAt: new Date().toISOString()
  });
}
