import { NextResponse } from 'next/server';

// Simple mock/forwarder for speech-to-text used by the client at /api/speech-to-text
// Behavior:
// - If NEXT_PUBLIC_API_BASE_URL is set it will attempt to forward the request to that host (keeps content-type and body)
// - Otherwise it returns a deterministic mocked transcript so the UI is usable in dev without an external service

export async function POST(req: Request) {
  try {
    const upstream = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || '';

    // If an upstream base url is configured, try to proxy the request there
    if (upstream) {
      try {
        const url = `${upstream.replace(/\/$/, '')}/api/speech-to-text`;
        // Clone request body
        const body = await req.arrayBuffer();
        const headers: Record<string, string> = {};
        const contentType = req.headers.get('content-type');
        if (contentType) headers['content-type'] = contentType;

        const res = await fetch(url, { method: 'POST', body, headers });
        const text = await res.text();
        return new Response(text, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
      } catch (err) {
        // fallthrough to mock response
        console.warn('speech-to-text proxy failed, returning mock transcript', err);
      }
    }

    // Try to read form data if present (supported in newer Next versions)
    let detectedText = '';
    try {
      // request.formData() may be available in the Next runtime
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (typeof (req as any).formData === 'function') {
        // @ts-ignore
        const fd: FormData = await (req as any).formData();
        const lang = String(fd.get('lang') ?? '');
        const audio = fd.get('audio');
        if (audio && typeof (audio as any).size === 'number') {
          detectedText = `(mock) Transcribed audio (${Math.round((audio as any).size / 1024)} KB) lang=${lang || 'unknown'}`;
        }
      }
    } catch (e) {
      // ignore formData parsing errors
    }

    if (!detectedText) detectedText = '(mock) Transcribed audio: Hello from TripFlow (development mock)';

    return NextResponse.json({ text: detectedText });
  } catch (err: any) {
    console.error('speech-to-text handler error', err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
