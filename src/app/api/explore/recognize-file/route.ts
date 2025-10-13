import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BASE = process.env.LANDMARKS_API_BASE_URL || "http://localhost:3000"

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get("image")
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 })
    }

    const upstream = new FormData()
    upstream.append("image", file, file.name)

    const res = await fetch(`${BASE}/landmarks/recognize-file`, {
      method: "POST",
      body: upstream,
      cache: "no-store",
    })

    const ct = res.headers.get("content-type") || ""
    if (ct.includes("application/json")) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(data, { status: res.status })
    } else {
      const text = await res.text().catch(() => "")
      return NextResponse.json(
        { success: res.ok, message: text || "Upstream returned non-JSON response" },
        { status: res.status }
      )
    }
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Upstream error" },
      { status: 502 }
    )
  }
}
