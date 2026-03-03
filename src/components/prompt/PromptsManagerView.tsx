import { useState } from 'react';
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { usePrompts } from '../../hooks/usePrompts.ts';
import { useChat } from '../../hooks/useChat.ts';
import type { Prompt } from '../../types/prompt.ts';
import PromptCreateModal from './PromptCreateModal.tsx';

// ─── 아바타 색상 (이름 기반 결정론적 색상) ─────────────────────────────────────

const AVATAR_COLORS = [
  '#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F59E0B',
  '#10B981', '#3B82F6', '#06B6D4', '#8B5CF6', '#F97316',
  '#44ccfd', '#E11D48', '#0EA5E9', '#16A34A', '#D97706',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (const c of id) hash = hash * 31 + c.charCodeAt(0);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

// ─── 단일 프롬프트 행 ──────────────────────────────────────────────────────────

interface PromptRowProps {
  prompt: Prompt;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function PromptRow({ prompt, onClick, onEdit, onDelete }: PromptRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const color = getAvatarColor(prompt.id);

  return (
    <div
      className="group flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* 아바타 */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-base shadow-sm"
        style={{ backgroundColor: color }}
      >
        {getInitial(prompt.name)}
      </div>

      {/* 이름 + 설명 */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-white text-sm leading-tight truncate">
          {prompt.name}
        </p>
        {prompt.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {prompt.description}
          </p>
        )}
      </div>

      {/* 사용 횟수 */}
      {prompt.usageCount > 0 && (
        <span className="text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full shrink-0 hidden sm:block">
          {prompt.usageCount}회 사용
        </span>
      )}

      {/* 액션 버튼들 (호버 시) */}
      <div
        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onEdit}
          aria-label="수정"
          title="수정"
          className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            aria-label="더보기"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-50">
                <button
                  onClick={() => { setShowMenu(false); onEdit(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  수정
                </button>
                <button
                  onClick={() => { setShowMenu(false); onDelete(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  삭제
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PromptsManagerView ────────────────────────────────────────────────────────

/** Gemini Gem 관리자 스타일의 프롬프트 전체 목록 페이지 */
export default function PromptsManagerView() {
  const { prompts, createPrompt, deletePrompt, updatePrompt } = usePrompts();
  const { selectPrompt } = useChat();

  const [showCreate, setShowCreate] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? prompts.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase()),
      )
    : prompts;

  // 최근 사용 순 정렬
  const sorted = [...filtered].sort(
    (a, b) => (b.lastUsedAt ?? b.createdAt) - (a.lastUsedAt ?? a.createdAt),
  );

  return (
    <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl mx-auto px-8 py-10">

          {/* 페이지 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              프롬프트 관리자
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
              AI와의 대화를 위한 나만의 프롬프트를 만들고 관리하세요.
            </p>
          </div>

          {/* 내 프롬프트 섹션 */}
          <div>
            {/* 섹션 헤더 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  내 프롬프트
                </h2>
                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {prompts.length}개
                </span>
              </div>

              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm"
                style={{ backgroundColor: '#44ccfd' }}
              >
                <Plus className="w-4 h-4" />
                새 프롬프트
              </button>
            </div>

            {/* 검색 (프롬프트 3개 이상일 때만 표시) */}
            {prompts.length >= 3 && (
              <div className="mb-4">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="프롬프트 검색..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#44ccfd] focus:ring-2 focus:ring-[#44ccfd]/20 transition-all placeholder-slate-400"
                />
              </div>
            )}

            {/* 프롬프트 목록 */}
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                {search ? (
                  <>
                    <p className="text-slate-400 text-sm">
                      '{search}'에 해당하는 프롬프트가 없습니다.
                    </p>
                    <button
                      onClick={() => setSearch('')}
                      className="text-xs text-[#44ccfd] hover:underline"
                    >
                      검색 초기화
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md"
                      style={{ backgroundColor: '#44ccfd' }}
                    >
                      P
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        아직 프롬프트가 없습니다
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        첫 번째 프롬프트를 만들어보세요!
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCreate(true)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-md transition-all hover:opacity-90"
                      style={{ backgroundColor: '#44ccfd' }}
                    >
                      <Plus className="w-4 h-4" />
                      첫 프롬프트 만들기
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {sorted.map((p) => (
                  <PromptRow
                    key={p.id}
                    prompt={p}
                    onClick={() => selectPrompt(p.id)}
                    onEdit={() => setEditingPrompt(p)}
                    onDelete={() => deletePrompt(p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 모달 */}
      {showCreate && (
        <PromptCreateModal
          onClose={() => setShowCreate(false)}
          onCreate={createPrompt}
        />
      )}

      {editingPrompt && (
        <PromptCreateModal
          onClose={() => setEditingPrompt(null)}
          onUpdate={(name, description, content) =>
            updatePrompt(editingPrompt.id, name, description, content)
          }
          initialData={{
            name: editingPrompt.name,
            description: editingPrompt.description,
            content: editingPrompt.content,
          }}
        />
      )}
    </div>
  );
}
