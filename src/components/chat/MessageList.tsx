import { useRef, useEffect, Fragment } from 'react';
import type { Message } from '../../types/index.ts';
import AIMessage from './AIMessage.tsx';
import UserMessage from './UserMessage.tsx';

interface Props {
  messages: Message[];
}

/** 메시지 목록. 새 메시지가 추가될 때마다 하단으로 자동 스크롤. */
export default function MessageList({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 pt-24 pb-40 space-y-8 custom-scrollbar">
      {/* 날짜 구분선 */}
      <div className="flex justify-center">
        <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs px-3 py-1 rounded-full">
          {new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>

      {messages.map((msg) => (
        <Fragment key={msg.id}>
          {msg.role === 'ai' ? (
            <AIMessage message={msg} />
          ) : (
            <UserMessage message={msg} />
          )}
        </Fragment>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
