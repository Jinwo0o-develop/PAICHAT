import { useState, useRef, useEffect } from 'react';
import { FileText, Copy, Pencil, Check, X } from 'lucide-react';
import type { Message } from '../../types/index.ts';
import { useChat } from '../../hooks/useChat.ts';

interface Props {
  message: Message;
}

/** 사용자 말풍선. 호버 시 복사/수정 버튼 표시. 수정 시 해당 지점부터 재생성. */
export default function UserMessage({ message: msg }: Props) {
  const { editMessage, isStreaming } = useChat();

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(msg.content);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 수정 모드 진입 시 높이 맞춤
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [isEditing]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleEditStart = () => {
    setDraft(msg.content);
    setIsEditing(true);
  };

  const handleEditSubmit = () => {
    if (draft.trim() && draft.trim() !== msg.content) {
      editMessage(msg.id, draft.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setDraft(msg.content);
    setIsEditing(false);
  };

  return (
    <div className="flex gap-4 flex-row-reverse max-w-3xl ml-auto animate-msg-right">
      {/* 아바타 */}
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
        <div
          className="w-full h-full rounded-full bg-cover bg-center"
          style={{ backgroundImage: "url('https://picsum.photos/seed/user/100/100')" }}
        />
      </div>

      <div className="space-y-1 flex flex-col items-end">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 pr-1 block">User</span>

        {/* 첨부 파일 미리보기 */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end">
            {msg.attachments.map((f) =>
              f.preview ? (
                <img
                  key={f.id}
                  src={f.preview}
                  alt={f.name}
                  className="max-w-[200px] max-h-[160px] rounded-xl object-cover shadow-sm border border-white/20"
                />
              ) : (
                <div
                  key={f.id}
                  className="flex items-center gap-2 bg-primary/80 text-white rounded-xl px-3 py-2 text-xs"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate max-w-[120px]">{f.name}</span>
                </div>
              ),
            )}
          </div>
        )}

        {/* 텍스트 버블 */}
        {(msg.content || msg.rewrittenContent) && (
          <div className="group/bubble relative">
            {isEditing ? (
              /* 수정 모드 */
              <div className="flex flex-col gap-2 min-w-[240px] max-w-[480px]">
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
                    if (e.key === 'Escape') handleEditCancel();
                  }}
                  className="w-full bg-primary/90 text-white rounded-l-2xl rounded-br-2xl px-5 py-4 resize-none focus:outline-none focus:ring-2 focus:ring-white/30 text-base leading-relaxed"
                  style={{ minHeight: '60px' }}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleEditCancel}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    취소
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    disabled={!draft.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    재생성
                  </button>
                </div>
              </div>
            ) : (
              /* 표시 모드 */
              <>
                <div className="bg-primary p-5 rounded-l-2xl rounded-br-2xl shadow-md text-white">
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                  {msg.rewrittenContent && (
                    <div className="mt-2 pt-2 border-t border-white/20 flex items-start gap-1.5 text-[11px] text-white/75">
                      <span className="shrink-0 mt-0.5">✏️</span>
                      <span className="italic leading-relaxed">{msg.rewrittenContent}</span>
                    </div>
                  )}
                </div>

                {/* 복사 / 수정 버튼 (호버 시) */}
                {!isStreaming && (
                  <div className="flex justify-end gap-1 mt-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
                    <button
                      onClick={handleCopy}
                      aria-label="복사"
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? '복사됨' : '복사'}
                    </button>
                    <button
                      onClick={handleEditStart}
                      aria-label="수정 후 재생성"
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      수정
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {!isEditing && (
          <span className="text-xs text-slate-400 pr-1 block">{msg.time}</span>
        )}
      </div>
    </div>
  );
}
