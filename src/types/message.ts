// ─── 파일 첨부 ─────────────────────────────────────────────────────────────
export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string; // data URL (이미지 전용)
}

// ─── 메시지 ────────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  time: string;
  model?: string;
  attachments?: AttachedFile[];
  isStreaming?: boolean;
  /** 에티켓 모드: AI가 교정한 문장 (원문은 content에 보존) */
  rewrittenContent?: string;
  /** 사용자 평가: 좋아요 / 싫어요 / 없음 */
  rating?: 'good' | 'bad';
}
