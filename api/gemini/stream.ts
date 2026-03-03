/**
 * Vercel Edge Function — Gemini SSE streaming proxy
 * Gemini의 SSE 스트림을 클라이언트로 그대로 파이프합니다.
 * API 키는 서버 환경변수에서만 읽으므로 브라우저에 노출되지 않습니다.
 */
export const config = { runtime: 'edge' };

interface ProxyBody {
  model: string;
  request: unknown;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { model, request } = (await req.json()) as ProxyBody;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return new Response(err, {
      status: upstream.status,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Gemini SSE 스트림을 클라이언트에 직접 파이프
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
