import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { usePrompts } from '../../hooks/usePrompts.ts';
import { useChat } from '../../hooks/useChat.ts';
import type { Prompt } from '../../types/prompt.ts';
import { LOGO_URL } from '../../constants/initialData.ts';
import PromptCreateModal from '../prompt/PromptCreateModal.tsx';

// ─── 단일 프롬프트 아이템 ─────────────────────────────────────────────────────

interface PromptItemProps {
  prompt: Prompt;
  onOpen: (p: Prompt) => void;
  onEdit?: (p: Prompt) => void;
}

function PromptItem({ prompt, onOpen, onEdit }: PromptItemProps) {
  return (
    <div
      onClick={() => onOpen(prompt)}
      className="group flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
    >
      <img
        src={LOGO_URL}
        alt="PAI"
        className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-100 dark:border-slate-700 p-0.5 shrink-0 shadow-sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate leading-tight">
          {prompt.name}
        </p>
        {prompt.description && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
            {prompt.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {prompt.usageCount > 0 && (
          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
            {prompt.usageCount}회
          </span>
        )}
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(prompt); }}
            aria-label="프롬프트 수정"
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-300 hover:text-primary transition-all"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
        <svg width="5" height="9" viewBox="0 0 5 9" fill="none" className="text-slate-300 dark:text-slate-600">
          <path d="M1 1L4 4.5L1 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ─── PromptSection ─────────────────────────────────────────────────────────────

/** 사이드바 내 프롬프트 섹션: 최근 2개 + 전체 관리 페이지 이동 버튼 */
export default function PromptSection() {
  const { recentPrompts, createPrompt, deletePrompt, updatePrompt } = usePrompts();
  const { selectPrompt, selectPromptsList } = useChat();

  const [showCreate, setShowCreate] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  return (
    <div className="px-4 pb-2">
      {/* ── 섹션 헤더 ── */}
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          프롬프트
        </h3>
        <div className="flex items-center gap-1.5">
          {/* + 버튼 */}
          <button
            onClick={() => setShowCreate(true)}
            aria-label="프롬프트 만들기"
            title="프롬프트 만들기"
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* 전체 목록 페이지 이동 버튼 - 원형, #44ccfd 배경, 흰색 화살표 */}
          <button
            onClick={selectPromptsList}
            aria-label="프롬프트 전체 목록 보기"
            title="저장된 프롬프트 전체 보기"
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:opacity-80 active:scale-95 shadow-sm"
            style={{ backgroundColor: '#44ccfd' }}
          >
            <svg width="13" height="11" viewBox="0 0 20 16" fill="none">
              <path
                d="M2 8H18M18 8L11 1M18 8L11 15"
                stroke="#FFFFFF"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ── 최근 사용 2개 (항상 표시) ── */}
      {recentPrompts.length > 0 ? (
        <div className="space-y-0.5">
          {recentPrompts.map((p) => (
            <PromptItem
              key={p.id}
              prompt={p}
              onOpen={(prompt) => selectPrompt(prompt.id)}
              onEdit={setEditingPrompt}
            />
          ))}
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full text-[11px] text-slate-400 hover:text-primary transition-colors py-1.5 text-center"
        >
          + 프롬프트를 추가해보세요
        </button>
      )}

      {/* 구분선 */}
      <div className="mt-3 border-t border-slate-100 dark:border-slate-800" />

      {/* ── 모달들 ── */}
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
