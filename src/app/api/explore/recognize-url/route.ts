import { NextResponse } from "next/server"

const BASE = process.env.LANDMARKS_API_BASE_URL || "http://localhost:3000"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const imageUrl = body?.imageUrl as string | undefined
    if (!imageUrl) {
      return NextResponse.json({ success: false, error: "Image URL is required" }, { status: 400 })
    }

    const res = await fetch(`${BASE}/landmarks/recognize-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Upstream error" },
      { status: 502 }
    )
  }
}
