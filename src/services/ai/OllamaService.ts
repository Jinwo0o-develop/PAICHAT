import type { ChatMessage } from '../../types/ai.ts';
import type { AIServiceStrategy } from './types.ts';
import { createContentPipeline } from './contentFilter.ts';

const BASE_URL = 'http://localhost:11434';
export const OLLAMA_MODEL = 'qwen3:4b';

/**
 * Ollama AI 서비스 구현 (Strategy 패턴).
 * Singleton으로 API 호출을 중앙화.
 */
export class OllamaService implements AIServiceStrategy {
  private static instance: OllamaService;

  private constructor() {}

  static getInstance(): OllamaService {
    if (!OllamaService.instance) {
      OllamaService.instance = new OllamaService();
    }
    return OllamaService.instance;
  }

  async complete(messages: ChatMessage[]): Promise<string> {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        think: false,
        options: { think: false },
      }),
    });
    if (!response.ok) {
      throw new Error(`Ollama 연결 오류 (${response.status})`);
    }
    const json = (await response.json()) as { message?: { content?: string } };
    return (json.message?.content ?? '')
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/^["']|["']$/g, '')
      .trim();
  }

  streamChat(
    messages: ChatMessage[],
    onToken: (token: string) => void,
    onDone: () => void,
    onError: (err: Error) => void,
  ): AbortController {
    const controller = new AbortController();
    const pipeline = createContentPipeline(onToken);

    const callDone = createOnceGuard(() => {
      pipeline.flush();
      onDone();
    });

    fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: true,
        think: false,
        options: { think: false },
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Ollama 연결 오류 (${response.status}): 서버가 실행 중인지 확인하세요.`,
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
              if (!line.trim()) continue;
              try {
                const json = JSON.parse(line);
                if (json.message?.content) pipeline.process(json.message.content);
                if (json.done === true) callDone();
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
