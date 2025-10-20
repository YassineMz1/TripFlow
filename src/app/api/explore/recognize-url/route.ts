// tripflow_next/src/app/api/explore/recognize-url/route.ts
export const runtime = 'edge'; // optional, remove if not desired

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const imageUrl: string | undefined = body?.imageUrl;
    if (!imageUrl) {
      return new Response(JSON.stringify({ success: false, error: 'imageUrl is required' }), { status: 400 });
    }

    // upstream backend URL (adjust if your backend runs elsewhere)
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
    const upstream = `${backendUrl.replace(/\/$/, '')}/landmarks/recognize-url`;

    // timeout / abort after 25s
    const controller = new AbortController();
    const timeoutMs = 25000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const r = await fetch(upstream, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!r.ok) {
        // include upstream body if any for debugging
        let upstreamText: string | null = null;
        try { upstreamText = await r.text(); } catch (_) { upstreamText = null; }
        return new Response(JSON.stringify({
          success: false,
          error: 'Upstream error',
          upstreamStatus: r.status,
          upstreamBody: upstreamText,
        }), { status: 502 });
      }

      const json = await r.json();

      // Normalize label -> display_name (support multiple backend shapes)
      const displayName =
        json.display_name ||
        (json.best_prediction && (json.best_prediction.landmark_name || json.best_prediction.landmarkName)) ||
        (Array.isArray(json.landmarks) && json.landmarks[0] && (json.landmarks[0].name || json.landmarks[0].landmark_name)) ||
        (Array.isArray(json.predictions) && json.predictions[0] && (json.predictions[0].landmark_name || json.predictions[0].name)) ||
        null;

      if (displayName && !json.display_name) {
        json.display_name = displayName;
      }

      // Always return a stable shape for the frontend to use
      return new Response(JSON.stringify({
        success: json.success ?? true,
        display_name: json.display_name ?? null,
        confidence: (json.best_prediction?.confidence ?? json.landmarks?.[0]?.confidence ?? json.predictions?.[0]?.confidence) ?? null,
        raw: json,
      }), { status: 200 });
    } catch (err: any) {
      clearTimeout(timer);
      if (err?.name === 'AbortError') {
        return new Response(JSON.stringify({ success: false, error: 'Upstream timeout' }), { status: 504 });
      }
      return new Response(JSON.stringify({ success: false, error: 'Upstream request failed', detail: String(err) }), { status: 502 });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: 'Bad request', detail: String(err) }), { status: 400 });
  }
}