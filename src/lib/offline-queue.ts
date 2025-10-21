type QueuedRequest = {
  id: string;
  url: string;
  method: string;
  headers?: Record<string,string>;
  body?: string | null;
  timestamp: number;
};

const QUEUE_KEY = 'tripflow_offline_queue_v1';

function readQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY) || '[]';
    return JSON.parse(raw);
  } catch (e) { return []; }
}

function writeQueue(q: QueuedRequest[]) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }

export function queueLength(): number { if (typeof window === 'undefined') return 0; return readQueue().length; }

export function enqueue(request: { url: string; method: string; headers?: Record<string,string>; body?: any }) {
  if (typeof window === 'undefined') return;
  const q = readQueue();
  const item: QueuedRequest = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2,9)}`,
    url: request.url,
    method: request.method,
    headers: request.headers,
    body: request.body ? JSON.stringify(request.body) : null,
    timestamp: Date.now(),
  };
  q.push(item);
  writeQueue(q);
}

export async function processQueue(): Promise<void> {
  if (typeof window === 'undefined') return;
  const q = readQueue();
  if (!q.length) return;
  const remaining: QueuedRequest[] = [];
  for (const item of q) {
    try {
      const init: RequestInit = { method: item.method, headers: item.headers || {}, body: item.body };
      const res = await fetch(item.url, init);
      if (!res.ok) {
        // failed, keep for retry
        remaining.push(item);
      }
    } catch (e) {
      remaining.push(item);
    }
  }
  writeQueue(remaining);
}
