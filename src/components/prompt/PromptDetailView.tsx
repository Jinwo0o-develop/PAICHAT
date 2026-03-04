import { ArrowLeft } from 'lucide-react';
import { useChat } from '../../hooks/useChat.ts';
import { usePrompts } from '../../hooks/usePrompts.ts';
import ChatInput from '../common/ChatInput.tsx';
import { LOGO_URL } from '../../constants/initialData.ts';
import type { AttachedFile } from '../../types/index.ts';

/** 프롬프트 상세 뷰: Gemini Gem 스타일 전체 페이지 */
export default function PromptDetailView() {
  const {
    activePromptId,
    conversations,
    isStreaming,
    startChat,
    selectConversation,
    newChat,
  } = useChat();
  const { prompts, markUsed } = usePrompts();

  const prompt = prompts.find((p) => p.id === activePromptId);

  if (!prompt) return null;

  // 이 프롬프트를 사용해 시작된 대화 최대 3개 (최신순)
  const promptConversations = conversations
    .filter((c) => c.promptId === activePromptId)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .slice(0, 3);

  const handleSend = (content: string, files: AttachedFile[]) => {
    markUsed(prompt.id);
    startChat(content, files, prompt.content, prompt.id);
  };

  return (
    <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark overflow-hidden relative">
      {/* 홈으로 */}
      <button
        onClick={newChat}
        aria-label="홈 화면으로"
        title="홈 화면으로"
        className="absolute top-4 left-4 z-10 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative">
        {/* 장식용 블롭 */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="min-h-full flex flex-col items-center justify-center px-8">
          <div className="w-full max-w-2xl flex flex-col items-center gap-6 py-10">

            {/* 로고 + 이름 + 설명 */}
            <div className="flex flex-col items-center gap-3 text-center">
              <img
                src={LOGO_URL}
                alt="PAI"
                className="w-20 h-20 rounded-2xl object-contain bg-white border border-slate-100 dark:border-slate-700 shadow-lg p-2"
              />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                {prompt.name}
              </h1>
              {prompt.description && (
                <p className="text-base text-slate-500 dark:text-slate-400">
                  {prompt.description}
                </p>
              )}
            </div>

            {/* 구분선 + 최근 대화 목록 */}
            {promptConversations.length > 0 && (
              <div className="w-full">
                <div className="border-t border-slate-200 dark:border-slate-700" />
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-3 mb-2 px-1">
                  최근
                </p>
                <div className="space-y-1">
                  {promptConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors text-left group"
                    >
                      <img
                        src={LOGO_URL}
                        alt=""
                        className="w-7 h-7 rounded-lg object-contain bg-white border border-slate-100 dark:border-slate-700 p-0.5 shrink-0"
                      />
                      <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                        {conv.title}
                      </span>
                      <svg
                        width="5"
                        height="9"
                        viewBox="0 0 5 9"
                        fill="none"
                        className="text-slate-300 dark:text-slate-600 shrink-0"
                      >
                        <path
                          d="M1 1L4 4.5L1 8"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 입력창 */}
            <div className="w-full mt-2">
              <ChatInput
                variant="welcome"
                autoFocus
                onSend={handleSend}
                disabled={isStreaming}
                placeholder={`${prompt.name}(으)로 대화를 시작하세요...`}
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
