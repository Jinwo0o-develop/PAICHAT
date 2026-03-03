import { useState, useEffect, useRef, Fragment } from 'react';
import type { KeyboardEvent, DragEvent } from 'react';
import { PlusCircle, ArrowUp, Mic, Square } from 'lucide-react';
import { useFileAttachment } from '../../hooks/useFileAttachment.ts';
import { cn } from '../../lib/cn.ts';
import type { AttachedFile } from '../../types/index.ts';
import FileChip from './FileChip.tsx';
import ModelSelector from '../chat/ModelSelector.tsx';

interface Props {
  onSend: (content: string, files: AttachedFile[]) => void;
  /** 스트리밍 중 취소 버튼(■) 콜백 */
  onCancel?: () => void;
  placeholder?: string;
  /** 'welcome' = 글로우 효과 + 마이크 버튼 포함 / 'chat' = 컴팩트 스타일 */
  variant?: 'welcome' | 'chat';
  autoFocus?: boolean;
  disabled?: boolean;
  /** true 이면 전송 버튼 대신 취소 버튼(■) 표시 */
  isStreaming?: boolean;
  /** 에티켓 모드 ON 시 true */
  etiquetteEnabled?: boolean;
  /** EtiquettePanel에서 주입된 텍스트 */
  injectedValue?: string;
  /** 주입된 텍스트를 input에 반영한 뒤 호출 (부모가 상태를 초기화하도록) */
  onInjectedValueConsumed?: () => void;
}

export default function ChatInput({
  onSend,
  onCancel,
  placeholder = '메시지를 입력하세요...',
  variant = 'chat',
  autoFocus = false,
  disabled = false,
  isStreaming = false,
  etiquetteEnabled = false,
  injectedValue,
  onInjectedValueConsumed,
}: Props) {
  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // EtiquettePanel에서 주입된 텍스트를 반영
  useEffect(() => {
    if (injectedValue) {
      setInput(injectedValue);
      onInjectedValueConsumed?.();
    }
  }, [injectedValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Esc 키 → 스트리밍 취소
  useEffect(() => {
    if (!isStreaming || !onCancel) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isStreaming, onCancel]);

  // textarea 높이 자동 조절
  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const {
    files,
    fileInputRef,
    removeFile,
    clearFiles,
    openPicker,
    handleInputChange,
    handleDrop,
    handleDragOver,
    handlePaste,
  } = useFileAttachment();

  const canSend = !disabled && (input.trim().length > 0 || files.length > 0);
  const isWelcome = variant === 'welcome';

  const send = () => {
    if (!canSend) return;
    onSend(input.trim(), files);
    setInput('');
    clearFiles();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    // Shift+Enter → 기본 동작(줄바꿈) 허용
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    setIsDragging(false);
    handleDrop(e);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleDragOver(e);
  };

  return (
    <div
      className="relative w-full"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={() => setIsDragging(false)}
    >
      {/* 드래그 오버레이 */}
      {isDragging && (
        <div className="absolute inset-0 z-20 rounded-3xl border-2 border-dashed border-primary bg-primary/10 flex items-center justify-center pointer-events-none backdrop-blur-sm">
          <p className="text-primary font-semibold text-sm">파일을 여기에 놓으세요</p>
        </div>
      )}

      {/* 첨부 파일 목록 */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-1">
          {files.map((f) => (
            <Fragment key={f.id}>
              <FileChip file={f} onRemove={removeFile} />
            </Fragment>
          ))}
        </div>
      )}

      {/* 숨겨진 파일 input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      {/* welcome 글로우 효과 */}
      {isWelcome && (
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-cyan-300/30 rounded-full blur opacity-25 hover:opacity-50 transition duration-200 pointer-events-none" />
      )}

      {/* 입력 바 */}
      <div
        className={cn(
          'relative flex items-end bg-white dark:bg-slate-800 border transition-all duration-200',
          isDragging
            ? 'border-primary ring-2 ring-primary/30'
            : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 focus-within:border-primary',
          isWelcome
            ? 'rounded-3xl p-2 shadow-xl shadow-slate-200/50 dark:shadow-none focus-within:ring-2 focus-within:ring-primary/50'
            : 'rounded-3xl p-2 shadow-lg focus-within:ring-2 focus-within:ring-primary/20',
        )}
      >
        {/* 파일 첨부 버튼 */}
        <button
          aria-label="파일 첨부"
          onClick={openPicker}
          className={cn(
            'flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full transition-colors ml-1',
            files.length > 0
              ? 'text-primary bg-primary/10'
              : 'text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-700',
          )}
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        {/* AI 모델 선택기 */}
        <div className="flex-shrink-0 ml-1 mb-1.5">
          <ModelSelector direction="up" compact />
        </div>

        {/* 텍스트 입력 (textarea, Shift+Enter = 줄바꿈) */}
        <textarea
          ref={textareaRef}
          autoFocus={autoFocus}
          value={input}
          rows={1}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className={cn(
            'flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-slate-800 dark:text-slate-100 text-base px-4 py-2 resize-none overflow-y-auto disabled:cursor-not-allowed leading-6',
            etiquetteEnabled
              ? 'placeholder-emerald-500'
              : 'placeholder-slate-400 dark:placeholder-slate-500',
          )}
          style={{ minHeight: '40px', maxHeight: '160px' }}
          placeholder={
            isStreaming
              ? 'PAI가 답변 중입니다...'
              : etiquetteEnabled
                ? '준비가 완료되었습니다 ✓  편하게 말씀해 주세요...'
                : placeholder
          }
          disabled={disabled}
        />

        <div className="flex items-center gap-1 pr-1 pb-0.5">
          {isWelcome && !isStreaming && (
            <button
              aria-label="음성 입력"
              className="hidden sm:flex items-center justify-center h-10 w-10 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          {isStreaming ? (
            /* 취소 버튼 ■ */
            <button
              onClick={onCancel}
              aria-label="생성 취소"
              className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Square className="w-4 h-4 fill-white" />
            </button>
          ) : (
            /* 전송 버튼 */
            <button
              onClick={send}
              disabled={!canSend}
              aria-label="전송"
              className="flex items-center justify-center h-10 w-10 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-primary/20 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
