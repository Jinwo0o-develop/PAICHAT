import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Lightbulb } from 'lucide-react';

interface Props {
  onClose: () => void;
  onCreate?: (name: string, description: string, content: string) => void;
  onUpdate?: (name: string, description: string, content: string) => void;
  initialData?: { name: string; description: string; content: string };
}

export default function PromptCreateModal({ onClose, onCreate, onUpdate, initialData }: Props) {
  const isEditMode = !!initialData;
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');

  const canSave = name.trim().length > 0 && content.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    if (isEditMode) {
      onUpdate?.(name, description, content);
    } else {
      onCreate?.(name, description, content);
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-modal-backdrop">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-[520px] max-w-[92vw] animate-modal-panel">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
            {isEditMode ? '프롬프트 수정' : '프롬프트 만들기'}
          </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 폼 */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              프롬프트 이름 <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="예: 창의적인 글쓰기 도우미"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              간략한 설명
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 소설, 에세이 작성 보조"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              프롬프트 내용 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="AI에게 전달할 역할이나 지시사항을 입력하세요...&#10;예: 당신은 창의적인 글쓰기 전문가입니다. 사용자의 글쓰기를 도와주세요."
              rows={5}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none transition-all leading-relaxed"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              AI가 대화 시작 시 이 내용을 역할로 부여받습니다.
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2 px-6 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <Save className="w-3.5 h-3.5" />
            저장
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
