import type { ChatMessage, GeminiModel } from '../../types/ai.ts';
import type { AIServiceStrategy } from './types.ts';

// ─── 내부 변환 타입 ────────────────────────────────────────────────────────────

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface GeminiRequest {
  contents: GeminiContent[];
  systemInstruction?: { parts: Array<{ text: string }> };
}

/**
 * ChatMessage[] -> Gemini 요청 포맷 변환.
 * - system 메시지 -> systemInstruction 으로 분리
 * - assistant -> model (역할 명칭 변환)
 * - 연속된 같은 역할 메시지는 병합 (Gemini는 역할 교대 필수)
 */
function toGeminiRequest(messages: ChatMessage[]): GeminiRequest {
  const systemMessages = messages.filter((m) => m.role === 'system');
  const chatMessages = messages.filter((m) => m.role !== 'system');

  const merged: ChatMessage[] = [];
  for (const msg of chatMessages) {
    const last = merged[merged.length - 1];
    if (last && last.role === msg.role) {
      merged[merged.length - 1] = { ...last, content: last.content + '\n' + msg.content };
    } else {
      merged.push(msg);
    }
  }

  const contents: GeminiContent[] = merged.map((m) => {
    const parts: GeminiPart[] = [];
    if (m.imageBase64) {
      parts.push({ inlineData: { mimeType: m.imageMime ?? 'image/jpeg', data: m.imageBase64 } });
    }
    if (m.content) parts.push({ text: m.content });
    return { role: m.role === 'assistant' ? 'model' : 'user', parts };
  });

  const req: GeminiRequest = { contents };
  if (systemMessages.length > 0) {
    req.systemInstruction = {
      parts: [{ text: systemMessages.map((m) => m.content).join('\n') }],
    };
  }
  return req;
}

/**
 * Gemini AI 서비스 구현 (Strategy 패턴).
 * API 키는 서버(Vercel Edge Function)에서만 처리되며,
 * 클라이언트는 /api/gemini/* 프록시를 통해서만 통신합니다.
 */
export class GeminiService implements AIServiceStrategy {
  private static instance: GeminiService;
  private model: GeminiModel;

  private constructor(model: GeminiModel = 'gemini-2.5-flash') {
    this.model = model;
  }

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /** 런타임 모델 전환 */
  setModel(model: GeminiModel): void {
    this.model = model;
  }

  getModel(): GeminiModel {
    return this.model;
  }

  async complete(messages: ChatMessage[]): Promise<string> {
    const response = await fetch('/api/gemini/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, request: toGeminiRequest(messages) }),
    });

    if (!response.ok) {
      throw new Error(`Gemini 프록시 오류 (${response.status})`);
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return (
      json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
    ).replace(/^["']|["']$/g, '').trim();
  }

  streamChat(
    messages: ChatMessage[],
    onToken: (token: string) => void,
    onDone: () => void,
    onError: (err: Error) => void,
  ): AbortController {
    const controller = new AbortController();

    const callDone = createOnceGuard(() => {
      onDone();
    });

    fetch('/api/gemini/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ model: this.model, request: toGeminiRequest(messages) }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Gemini 프록시 오류 (${response.status}): API 키 또는 모델명을 확인하세요.`,
          );
        }
        const reader = response.body?.getReader();
        if (!reader) throw new Error('응답 스트림을 읽을 수 없습니다.');

        const decoder = new TextDecoder();
        let lineBuffer = '';

        function pump(): Promise<void> {
          return reader!.read().then(({ done, value }) => {
            if (done) {
              callDone();
              return;
            }

            lineBuffer += decoder.decode(value, { stream: true });
            const lines = lineBuffer.split('\n');
            lineBuffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (!data || data === '[DONE]') {
                callDone();
                return;
              }
              try {
                const json = JSON.parse(data) as {
                  candidates?: Array<{
                    content?: { parts?: Array<{ text?: string }> };
                    finishReason?: string;
                  }>;
                };
                const candidate = json.candidates?.[0];
                const text =
                  candidate?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
                if (text) onToken(text);
                if (candidate?.finishReason) callDone();
              } catch {
                // JSON 파싱 오류 무시
              }
            }
            return pump();
          });
        }

        return pump();
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        onError(err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.'));
      });

    return controller;
  }
}

/** 1회만 실행되는 콜백 래퍼 */
function createOnceGuard(fn: () => void): () => void {
  let called = false;
  return () => {
    if (called) return;
    called = true;
    fn();
  };
}
