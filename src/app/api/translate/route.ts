import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body?.text ?? '');
    const target = String(body?.target ?? 'en');
    const source = String(body?.source ?? 'auto');

    if (!text) return NextResponse.json({ error: 'empty' }, { status: 400 });

    // Call Google Translate unofficial endpoint from server (no CORS)
    const sl = source === 'auto' ? 'auto' : source;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      return NextResponse.json({ error: 'upstream', status: resp.status, body: txt }, { status: 502 });
    }
    const data = await resp.json().catch(() => null);
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map((seg: any) => (Array.isArray(seg) ? seg[0] : '')).join('');
      return NextResponse.json({ translatedText: translated });
    }
    return NextResponse.json({ error: 'unexpected' }, { status: 502 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
