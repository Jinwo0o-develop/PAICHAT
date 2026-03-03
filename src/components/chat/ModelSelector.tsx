import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Cpu, Sparkles, Check } from 'lucide-react';
import { useChat } from '../../hooks/useChat.ts';
import { cn } from '../../lib/cn.ts';
import type { AIProvider, GeminiModel } from '../../types/index.ts';

interface ModelOption {
  provider: AIProvider;
  model: GeminiModel | null; // null = Ollama
  label: string;
  short: string;
}

const MODELS: ModelOption[] = [
  { provider: 'ollama',  model: null,                      label: 'qwen3:4b  ·  Local',      short: 'Ollama'    },
  { provider: 'gemini',  model: 'gemini-2.5-flash-lite',   label: 'Gemini 2.5 Flash Lite',   short: '2.5 Lite'  },
  { provider: 'gemini',  model: 'gemini-2.5-flash',        label: 'Gemini 2.5 Flash',        short: '2.5 Flash' },
  { provider: 'gemini',  model: 'gemini-3-flash-preview',  label: 'Gemini 3 Flash',          short: '3 Flash'   },
  { provider: 'gemini',  model: 'gemini-3-pro-preview',    label: 'Gemini 3 Pro',            short: '3 Pro'     },
];

interface Props {
  direction?: 'down' | 'up';
  compact?: boolean;
  value?: { provider: AIProvider; geminiModel: GeminiModel };
  onSelect?: (provider: AIProvider, model: GeminiModel) => void;
}

/** AI 모델 선택 드롭다운 */
export default function ModelSelector({
  direction = 'down',
  compact = false,
  value,
  onSelect,
}: Props) {
  const { aiProvider, geminiModel, setModel } = useChat();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const activeProvider = value?.provider ?? aiProvider;
  const activeGeminiModel = value?.geminiModel ?? geminiModel;

  const current =
    MODELS.find(
      (m) =>
        m.provider === activeProvider &&
        (activeProvider === 'ollama' || m.model === activeGeminiModel),
    ) ?? MODELS[2];

  const handleSelect = (option: ModelOption) => {
    const newProvider = option.provider;
    const newModel = option.model ?? activeGeminiModel;
    if (onSelect) {
      onSelect(newProvider, newModel);
    } else {
      setModel(newProvider, newModel);
    }
    setOpen(false);
  };

  const isActive = (option: ModelOption) =>
    option.provider === activeProvider &&
    (option.provider === 'ollama' || option.model === activeGeminiModel);

  const Icon = current.provider === 'gemini' ? Sparkles : Cpu;

  return (
    <div ref={ref} className="relative">
      {/* 트리거 버튼 */}
      {compact ? (
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-primary/50 transition-colors shadow-sm"
        >
          <Icon className="w-3 h-3 text-primary shrink-0" />
          <span>{current.short}</span>
          <ChevronDown
            className={cn(
              'w-3 h-3 text-slate-400 transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </button>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full pl-4 pr-2 py-1 shadow-sm hover:shadow transition-shadow"
        >
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">AI MODEL</span>
          <div className="flex items-center gap-1 bg-primary text-white rounded-full px-3 py-1 text-xs font-bold">
            <Icon className="w-3 h-3" />
            <span>{current.short}</span>
          </div>
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 text-slate-400 transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </button>
      )}

      {/* 드롭다운 */}
      {open && (
        <div
          className={cn(
            'absolute right-0 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg py-1.5 z-50',
            direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2',
          )}
        >
          {MODELS.map((option) => {
            const active = isActive(option);
            const key = option.provider === 'ollama' ? 'ollama' : option.model;
            return (
              <button
                key={key}
                onClick={() => handleSelect(option)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700',
                )}
              >
                {option.provider === 'gemini' ? (
                  <Sparkles className="w-4 h-4 shrink-0 text-blue-500" />
                ) : (
                  <Cpu className="w-4 h-4 shrink-0 text-slate-400" />
                )}
                <span className="flex-1 text-left truncate">{option.label}</span>
                {active && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
