import { NextResponse } from 'next/server';

// Reads the access requests raised from the DNS-PEP coach page (apexastute /blocked),
// which are recorded to the shared Upstash KV list `demo:itsm`. Surfaced in the ITSM
// console so a request the evaluator raises appears here, auto-triaged and pending.
// No-ops to an empty list when KV isn't configured (add KV_REST_API_URL / KV_REST_API_TOKEN).
export const dynamic = 'force-dynamic';

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

interface ItsmRequest {
  ticket: string; domain: string; score: number; category: string;
  note?: string; priority: string; status: string; at: number;
}

export async function GET() {
  if (!KV_URL || !KV_TOKEN) return NextResponse.json({ configured: false, requests: [] });
  try {
    const res = await fetch(KV_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['LRANGE', 'demo:itsm', 0, 99]),
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ configured: true, requests: [] });
    const data = await res.json() as { result?: unknown };
    const rows = Array.isArray(data.result) ? (data.result as string[]) : [];
    const requests = rows
      .map((s) => { try { return JSON.parse(s) as ItsmRequest; } catch { return null; } })
      .filter((x): x is ItsmRequest => x !== null);
    return NextResponse.json({ configured: true, requests });
  } catch {
    return NextResponse.json({ configured: true, requests: [] });
  }
}
