import { useChat } from '../../hooks/useChat.ts';
import ChatInput from '../common/ChatInput.tsx';

/** 환영 화면: 헤드라인 + 입력창 */
export default function WelcomeScreen() {
  const { startChat, isStreaming } = useChat();

  return (
    <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark overflow-hidden">
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative">
        {/* 장식용 블롭 */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="min-h-full flex flex-col items-center justify-center px-8">
          <div className="w-full max-w-2xl flex flex-col items-center gap-8 py-10">
            {/* 환영 헤드라인 */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <span className="text-base mr-1">👋</span>
                환영합니다
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                사용자님 반갑습니다
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg max-w-lg mx-auto pt-2">
                오늘 무엇을 도와드릴까요? 편하게 대화를 시작해보세요.
              </p>
            </div>

            {/* 입력창 */}
            <div className="w-full mt-2">
              <ChatInput
                variant="welcome"
                autoFocus
                onSend={(content, files) => startChat(content, files)}
                disabled={isStreaming}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center shrink-0">
        <p className="text-xs text-slate-400 dark:text-slate-600">
          AI는 실수를 할 수 있습니다. 중요한 정보는 직접 확인이 필요합니다.
        </p>
      </footer>
    </div>
  );
}
