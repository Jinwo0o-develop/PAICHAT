/**
 * 현재 시각을 "오전 HH:MM" / "오후 HH:MM" 형식의 한국어 문자열로 반환.
 */
export function now(): string {
  return new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Unix timestamp(ms)를 상대 시간 문자열로 변환.
 * 최대 표기: "2달 전" (60일 이상 모두 동일 표기)
 */
export function relativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1)  return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHr  < 24) return `${diffHr}시간 전`;
  if (diffDay < 60) return `${diffDay}일 전`;
  return '2달 전';
}
