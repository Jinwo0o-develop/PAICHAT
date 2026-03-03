// ─── 프롬프트 타입 ─────────────────────────────────────────────────────────────

export interface Prompt {
  id: string;
  /** 프롬프트 이름 */
  name: string;
  /** 간략한 설명 */
  description: string;
  /** AI에게 전달할 시스템 역할/지시사항 */
  content: string;
  createdAt: number;
  /** 마지막 사용 시각 (사용한 적 없으면 undefined) */
  lastUsedAt?: number;
  /** 누적 사용 횟수 */
  usageCount: number;
}
