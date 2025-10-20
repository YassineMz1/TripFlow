import { NextResponse } from "next/server"

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL

export async function GET() {
  try {
    const res = await fetch(`${BASE}/landmarks/health`, { cache: "no-store" })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Health check failed" },
      { status: 502 }
    )
  }
}
