// tripflow_next/src/app/api/explore/recognize-file/route.ts
export const runtime = 'edge'; // optional

export async function POST(req: Request) {
  // We expect a 'multipart/form-data' FormData with a field named 'image'
  try {
    const form = await req.formData();
    const file = form.get('image');
    if (!file) {
      return new Response(JSON.stringify({ success: false, error: 'No file uploaded' }), { status: 400 });
    }
    // If backend has a file endpoint, forward it. If not, return a clear message
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
    const upstreamFileEndpoint = `${backendUrl.replace(/\/$/, '')}/landmarks/recognize-file`;

    // Build forwarding FormData
    const forward = new FormData();
    // file is a File object in Edge/Next runtime
    forward.append('image', file as File, (file as File).name || 'upload.jpg');

    // small timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    try {
      const r = await fetch(upstreamFileEndpoint, {
        method: 'POST',
        body: forward,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!r.ok) {
        // If the backend returns 404/501, provide a friendly message
        const text = await r.text().catch(() => null);
        return new Response(JSON.stringify({
          success: false,
          error: 'Backend file recognition failed or not implemented',
          upstreamStatus: r.status,
          upstreamBody: text,
          note: 'Make sure backend /landmarks/recognize-file exists and is up',
        }), { status: 502 });
      }

      const json = await r.json();
      // Normalize as above
      const displayName =
        json.display_name ||
        (json.best_prediction && (json.best_prediction.landmark_name || json.best_prediction.landmarkName)) ||
        (Array.isArray(json.landmarks) && json.landmarks[0] && (json.landmarks[0].name || json.landmarks[0].landmark_name)) ||
        null;
      return new Response(JSON.stringify({ success: json.success ?? true, display_name: displayName ?? null, raw: json }), { status: 200 });
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