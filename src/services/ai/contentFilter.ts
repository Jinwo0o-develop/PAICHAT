// ─── Decorator 패턴: 콘텐츠 처리 파이프라인 ─────────────────────────────────

/**
 * ContentFilter: 토큰 스트림을 처리하는 인터페이스.
 * 각 필터는 다음 핸들러를 '장식(decorate)'하며 독립적으로 체이닝 가능.
 */
export interface ContentFilter {
  process: (chunk: string) => void;
  flush: () => void;
}

/**
 * <think>...</think> 블록 필터 (상태 머신)
 *
 * qwen3:4b 는 두 가지 형식으로 사고 과정을 출력한다.
 *   형식 A: <think>사고내용</think>실제응답
 *   형식 B: 사고내용</think>실제응답  (여는 태그 생략)
 *
 * "</think>" 구분자 기준으로 필터링:
 *   1) </think> 전: 버퍼에만 누적 (화면 미출력)
 *   2) </think> 발견: 이후 토큰부터 next.process()로 전달
 *   3) </think> 없이 종료: 버퍼 전체 방출 (일반 응답)
 */
export function buildThinkFilter(next: ContentFilter): ContentFilter {
  const CLOSE_TAG = '</think>';
  let pastThink = false;
  let skipLeadingWhitespace = false;
  let buf = '';
  let flushed = false;

  return {
    process(token: string): void {
      if (pastThink) {
        if (skipLeadingWhitespace) {
          const trimmed = token.trimStart();
          if (trimmed) {
            skipLeadingWhitespace = false;
            next.process(trimmed);
          }
        } else {
          next.process(token);
        }
        return;
      }

      buf += token;
      const closeIdx = buf.indexOf(CLOSE_TAG);
      if (closeIdx !== -1) {
        pastThink = true;
        const after = buf.slice(closeIdx + CLOSE_TAG.length).trimStart();
        buf = '';
        if (after) next.process(after);
        else skipLeadingWhitespace = true;
      }
    },
    flush(): void {
      if (flushed) return;
      flushed = true;
      if (buf) {
        next.process(buf);
        buf = '';
      }
      next.flush();
    },
  };
}

/**
 * 콘텐츠 파이프라인 생성.
 * Decorator 패턴: 필터를 체이닝하여 확장 가능한 처리 흐름 구성.
 */
export function createContentPipeline(onOutput: (text: string) => void): ContentFilter {
  const sink: ContentFilter = { process: onOutput, flush: () => {} };
  return buildThinkFilter(sink);
}
