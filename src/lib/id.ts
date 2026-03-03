/**
 * 타임스탬프 기반 고유 ID 생성.
 * 밀리초 정밀도로 대부분의 클라이언트 시나리오에서 충분히 고유하다.
 */
export function generateId(prefix?: string): string {
  const ts = Date.now().toString();
  return prefix ? `${prefix}-${ts}` : ts;
}

/**
 * 파일 첨부 등에 사용하는 랜덤 포함 ID.
 */
export function generateRandomId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
