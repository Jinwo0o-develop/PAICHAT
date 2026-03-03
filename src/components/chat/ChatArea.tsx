import { useRef, useCallback } from 'react';
import type { Conversation } from '../../types/index.ts';
import { useChat } from '../../hooks/useChat.ts';
import ChatHeader from './ChatHeader.tsx';
import MessageList from './MessageList.tsx';
import ChatFooter from './ChatFooter.tsx';

interface Props {
  conversation: Conversation;
}

/** 채팅 화면 레이아웃 쉘: 헤더 + 메시지 목록 + 입력 영역 조합 */
export default function ChatArea({ conversation }: Props) {
  const { isEtiquetteEnabled, isStreaming, activeId, proactiveMessage } = useChat();

  // ── 화면 반복 클릭 → 심심함 감지 ──────────────────────────────────
  const BOREDOM_CLICKS = 5;   // 이 횟수 이상 클릭 시 트리거
  const BOREDOM_WINDOW = 4000; // ms 내 클릭 카운트 유지

  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAreaClick = useCallback(() => {
    if (!isEtiquetteEnabled || isStreaming || !activeId) return;

    clickCount.current += 1;

    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      clickCount.current = 0;
    }, BOREDOM_WINDOW);

    if (clickCount.current >= BOREDOM_CLICKS) {
      clickCount.current = 0;
      if (clickTimer.current) clearTimeout(clickTimer.current);
      proactiveMessage();
    }
  }, [isEtiquetteEnabled, isStreaming, activeId, proactiveMessage]);

  return (
    <main
      className="flex-1 flex flex-col relative bg-background-light dark:bg-background-dark overflow-hidden"
      onClick={handleAreaClick}
    >
      <ChatHeader conversation={conversation} />
      <MessageList messages={conversation.messages} />
      <ChatFooter />
    </main>
  );
}
