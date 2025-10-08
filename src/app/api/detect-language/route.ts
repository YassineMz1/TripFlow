import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = String(body?.text ?? '').trim();
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });

    const API_KEY = process.env.DETECTLANG_API_KEY;

    // If we have an API key for DetectLanguage, use it.
    if (API_KEY) {
      try {
        const resp = await fetch('https://ws.detectlanguage.com/0.2/detect', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ q: text }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const detection = data?.data?.detections?.[0];
          if (detection) {
            const code = detection.language;
            const confidence = detection.confidence;
            const isReliable = detection.isReliable;
            let name: string | null = null;
            try {
              const dn = new Intl.DisplayNames(['fr', 'en'], { type: 'language' });
              name = dn.of(code) || null;
            } catch (e) {}
            return NextResponse.json({ language: code, name, confidence, isReliable });
          }
        }
      } catch (e) {
        // keep errors silent here; we'll fall through to the Google fallback
      }
    }

    // Google Translate undocumented/free endpoint as a fallback when no API key is present.
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
      const gresp = await fetch(url, { method: 'GET' });
      if (gresp.ok) {
        const ga = await gresp.json().catch(() => null);
        const detected = Array.isArray(ga) && ga.length > 2 ? ga[2] : null;
        const code = detected ? String(detected).toLowerCase() : null;
        if (code) {
          let name: string | null = null;
          try {
            const dn = new Intl.DisplayNames(['fr', 'en'], { type: 'language' });
            name = dn.of(code) || null;
          } catch (e) {}
          return NextResponse.json({ language: code, name, confidence: null });
        }
      }
    } catch (e) {
      // last resort, return null
    }

    return NextResponse.json({ language: null });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
