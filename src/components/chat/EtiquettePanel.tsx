import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles, Loader2, Send, X, Minus, GripHorizontal, AlertCircle, Paperclip, ImageIcon,
} from 'lucide-react';
import { useChat } from '../../hooks/useChat.ts';
import { AIServiceFactory } from '../../services/ai/index.ts';
import type { ChatMessage } from '../../types/index.ts';
import { cn } from '../../lib/cn.ts';
import { LOGO_URL } from '../../constants/initialData.ts';

interface Props {
  onSend: (text: string) => void;
}

// ── 오류 파서 ────────────────────────────────────────────────────────────────
function parseAIError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();
  if (lower.includes('econnrefused') || lower.includes('failed to fetch') || lower.includes('fetch failed'))
    return 'AI 서버에 연결할 수 없습니다.\nOllama가 실행 중인지 또는 인터넷 연결을 확인해주세요.';
  if (lower.includes('api key') || lower.includes('unauthorized') || lower.includes('401'))
    return 'API 키가 올바르지 않거나 만료되었습니다.\nGemini API 키 설정을 확인해주세요.';
  if (lower.includes('quota') || lower.includes('rate limit') || lower.includes('429'))
    return 'API 사용 한도를 초과했습니다.\n잠시 후 다시 시도하거나 다른 모델을 선택해주세요.';
  if (lower.includes('timeout') || lower.includes('timed out'))
    return '요청 시간이 초과되었습니다.\n네트워크 상태를 확인하고 다시 시도해주세요.';
  if (lower.includes('model') && lower.includes('not found'))
    return '선택한 AI 모델을 찾을 수 없습니다.\n모델이 설치되어 있는지 확인해주세요.';
  if (lower.includes('500') || lower.includes('internal server'))
    return 'AI 서버 내부 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.';
  if (lower.includes('403') || lower.includes('forbidden'))
    return '이 모델에 접근 권한이 없습니다.\nAPI 키 또는 모델 설정을 확인해주세요.';
  return `알 수 없는 오류가 발생했습니다.\n(${raw.slice(0, 80)})`;
}

// ── 리사이즈 방향 ─────────────────────────────────────────────────────────────
type Dir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const CURSOR: Record<Dir, string> = {
  n: 'cursor-n-resize', s: 'cursor-s-resize',
  e: 'cursor-e-resize', w: 'cursor-w-resize',
  ne: 'cursor-ne-resize', nw: 'cursor-nw-resize',
  se: 'cursor-se-resize', sw: 'cursor-sw-resize',
};

const HANDLE_POS: Record<Dir, string> = {
  n:  'top-0    left-3   right-3  h-2',
  s:  'bottom-0 left-3   right-3  h-2',
  e:  'right-0  top-3    bottom-3 w-2',
  w:  'left-0   top-3    bottom-3 w-2',
  ne: 'top-0    right-0  w-4 h-4',
  nw: 'top-0    left-0   w-4 h-4',
  se: 'bottom-0 right-0  w-4 h-4',
  sw: 'bottom-0 left-0   w-4 h-4',
};

const MIN_W = 280, MIN_H = 180, MAX_W = 760, MAX_H = 860;
const INIT_W = 360, INIT_H = 480;

/** EtiquettePanel — 드래그/리사이즈 가능, 파일첨부 지원 플로팅 창 */
export default function EtiquettePanel({ onSend }: Props) {
  const { activeConversation, activeId, etiquetteProvider, etiquetteGeminiModel, toggleEtiquette } =
    useChat();

  // ── 위치 / 크기 / 최소화 ──────────────────────────────────────────────
  const [pos, setPos] = useState(() => ({
    x: window.innerWidth  - INIT_W - 24,
    y: window.innerHeight - INIT_H - 200,
  }));
  const [size, setSize] = useState({ w: INIT_W, h: INIT_H });
  const [isMinimized, setIsMinimized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 드래그
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const handleDragMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      const pw = panelRef.current?.offsetWidth ?? size.w;
      const ph = panelRef.current?.offsetHeight ?? size.h;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth  - pw, dragStart.current.px + ev.clientX - dragStart.current.mx)),
        y: Math.max(0, Math.min(window.innerHeight - 40, dragStart.current.py + ev.clientY - dragStart.current.my)),
      });
    };
    const onUp = () => { dragStart.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // 리사이즈
  const handleResizeMouseDown = (e: React.MouseEvent, dir: Dir) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: sx, clientY: sy } = e;
    const { w: sw, h: sh } = size;
    const { x: spx, y: spy } = pos;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      let nw = sw, nh = sh, nx = spx, ny = spy;
      if (dir.includes('e')) nw = Math.max(MIN_W, Math.min(MAX_W, sw + dx));
      if (dir.includes('s')) nh = Math.max(MIN_H, Math.min(MAX_H, sh + dy));
      if (dir.includes('w')) { nw = Math.max(MIN_W, Math.min(MAX_W, sw - dx)); nx = spx + (sw - nw); }
      if (dir.includes('n')) { nh = Math.max(MIN_H, Math.min(MAX_H, sh - dy)); ny = spy + (sh - nh); }
      setSize({ w: nw, h: nh });
      if (dir.includes('w') || dir.includes('n')) setPos({ x: nx, y: ny });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── AI 상태 ────────────────────────────────────────────────────────────
  const [rawInput, setRawInput] = useState('');
  const [contextSummary, setContextSummary] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // ── 파일 첨부 ──────────────────────────────────────────────────────────
  interface PanelFile { name: string; mime: string; base64: string; preview?: string; textContent?: string }
  const [panelFile, setPanelFile] = useState<PanelFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (file.type.startsWith('image/')) {
        const base64 = result.split(',')[1] ?? '';
        setPanelFile({ name: file.name, mime: file.type, base64, preview: result });
      } else {
        // 텍스트/문서 파일: 내용을 텍스트로 읽어 context에 포함
        setPanelFile({ name: file.name, mime: file.type, base64: '', textContent: result });
      }
    };
    if (file.type.startsWith('image/')) reader.readAsDataURL(file);
    else reader.readAsText(file);
    e.target.value = '';
  };

  // ── 컨텍스트 분석 (마운트 1회) ────────────────────────────────────────
  const analyzed = useRef(false);
  useEffect(() => {
    if (analyzed.current) return;
    analyzed.current = true;
    const messages = (activeConversation?.messages ?? []).filter(m => !m.isStreaming && m.content);
    if (messages.length < 2) { setContextSummary('대화를 시작하면 관계를 분석할 수 있습니다.'); return; }
    setIsAnalyzing(true);
    const service = AIServiceFactory.getService(etiquetteProvider, etiquetteGeminiModel);
    const history: ChatMessage[] = messages.slice(-8).map(m => ({
      role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
      content: m.content,
    }));
    service.complete([...history, { role: 'user', content: '위 대화를 분석하여 대화 참여자들의 관계와 분위기를 한 문장으로 요약해주세요. 요약만 출력하세요.' }])
      .then(r => setContextSummary(r.trim()))
      .catch(err => setAnalysisError(parseAIError(err)))
      .finally(() => setIsAnalyzing(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 표현 변환 ─────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!rawInput.trim() || isGenerating) return;
    setIsGenerating(true); setOptions([]); setSelectedOption(null); setGenerationError(null);
    const service = AIServiceFactory.getService(etiquetteProvider, etiquetteGeminiModel);
    const messages = (activeConversation?.messages ?? []).filter(m => !m.isStreaming && m.content);
    const history: ChatMessage[] = messages.slice(-6).map(m => ({
      role: m.role === 'ai' ? 'assistant' as const : 'user' as const, content: m.content,
    }));
    // 파일 첨부 처리
    const fileCtx = panelFile?.textContent
      ? `\n\n[첨부 파일: ${panelFile.name}]\n${panelFile.textContent.slice(0, 800)}`
      : '';
    const lastMsg: ChatMessage = {
      role: 'user',
      content: `다음 말을 정중한 한국어로 3가지 방식으로 다시 표현해주세요: "${rawInput}"${fileCtx}\n규칙: 각 표현을 줄바꿈으로 구분하여 3줄만 출력하세요. 번호나 설명은 넣지 마세요.`,
      ...(panelFile?.base64 ? { imageBase64: panelFile.base64, imageMime: panelFile.mime } : {}),
    };
    try {
      const result = await service.complete([...history, lastMsg]);
      const lines = result.split('\n').map(l => l.replace(/^[0-9]+[.)]\s*/, '').trim()).filter(l => l.length > 2).slice(0, 3);
      if (lines.length === 0) setGenerationError('표현을 생성하지 못했습니다.\nAI 모델 연결을 확인해주세요.');
      else { setOptions(lines); setSelectedOption(0); }
    } catch (err) { setGenerationError(parseAIError(err)); }
    finally { setIsGenerating(false); }
  };

  const handleSend = () => {
    if (selectedOption === null || !options[selectedOption]) return;
    onSend(options[selectedOption]);
    setRawInput(''); setOptions([]); setSelectedOption(null); setGenerationError(null);
  };

  const handleClose = () => { if (activeId) toggleEtiquette(activeId); };

  // ── 렌더 ──────────────────────────────────────────────────────────────
  const renderedH = isMinimized ? 52 : size.h;

  const panel = (
    <div
      ref={panelRef}
      className="fixed z-50"
      style={{ left: pos.x, top: pos.y, width: size.w, height: renderedH }}
    >
      {/* 리사이즈 핸들 (최소화 시 숨김) */}
      {!isMinimized && ((['n','s','e','w','ne','nw','se','sw'] as Dir[]).map(dir => (
        <div
          key={dir}
          onMouseDown={e => handleResizeMouseDown(e, dir)}
          className={cn(
            'absolute z-20 group',
            HANDLE_POS[dir],
            CURSOR[dir],
          )}
        >
          {/* 모서리 시각 표시 */}
          {(dir === 'se' || dir === 'sw' || dir === 'ne' || dir === 'nw') && (
            <div className={cn(
              'absolute w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity',
              dir === 'se' && 'bottom-0.5 right-0.5 border-b-2 border-r-2 border-slate-400 dark:border-slate-500 rounded-br',
              dir === 'sw' && 'bottom-0.5 left-0.5  border-b-2 border-l-2 border-slate-400 dark:border-slate-500 rounded-bl',
              dir === 'ne' && 'top-0.5   right-0.5 border-t-2 border-r-2 border-slate-400 dark:border-slate-500 rounded-tr',
              dir === 'nw' && 'top-0.5   left-0.5  border-t-2 border-l-2 border-slate-400 dark:border-slate-500 rounded-tl',
            )} />
          )}
          {/* 엣지 시각 표시 */}
          {(dir === 'n' || dir === 's') && (
            <div className="absolute inset-x-1/3 inset-y-0.5 rounded-full bg-slate-300 dark:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          {(dir === 'e' || dir === 'w') && (
            <div className="absolute inset-y-1/3 inset-x-0.5 rounded-full bg-slate-300 dark:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      )))}

      {/* 패널 본체 */}
      <div className="flex flex-col w-full h-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

        {/* 헤더 (드래그 핸들) */}
        <div
          onMouseDown={handleDragMouseDown}
          className="flex items-center gap-2 px-3 py-3 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-100 dark:border-emerald-900 shrink-0 cursor-move select-none"
        >
          <GripHorizontal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-sm text-emerald-800 dark:text-emerald-300 flex-1">에티켓 AI</span>
          {isAnalyzing && !isMinimized && (
            <span className="text-[10px] text-emerald-600 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />분석 중
            </span>
          )}
          <div className="flex items-center gap-0.5" onMouseDown={e => e.stopPropagation()}>
            <button onClick={() => setIsMinimized(v => !v)} aria-label={isMinimized ? '창 펼치기' : '창 내리기'}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 transition-colors">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleClose} aria-label="패널 닫기 (AI OFF)"
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-emerald-600 dark:text-emerald-400 hover:text-red-500 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 아래 내용 (최소화 시 숨김) */}
        {!isMinimized && (
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">

            {/* 관계 분석 */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-start gap-2">
                <img src={LOGO_URL} alt="PAI" className="w-7 h-7 rounded-full object-contain shrink-0 bg-white shadow-sm" />
                <div className={cn(
                  'rounded-2xl rounded-tl-none px-3 py-2 text-xs flex-1 leading-relaxed',
                  analysisError
                    ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
                )}>
                  {isAnalyzing ? (
                    <span className="text-slate-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />준비되었습니다.
                    </span>
                  ) : analysisError ? (
                    <span className="flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="whitespace-pre-line">{analysisError}</span>
                    </span>
                  ) : (contextSummary ?? '준비되었습니다.')}
                </div>
              </div>
            </div>

            {/* 파일 첨부 미리보기 */}
            {panelFile && (
              <div className="px-4 pt-2 shrink-0">
                <div className="flex items-center gap-2 px-2 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  {panelFile.preview
                    ? <img src={panelFile.preview} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                    : <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                  }
                  <span className="text-xs text-emerald-700 dark:text-emerald-300 truncate flex-1">{panelFile.name}</span>
                  <button onClick={() => setPanelFile(null)} className="text-emerald-500 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 원문 입력 */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <p className="text-[10px] text-slate-400 mb-2">편하게 말씀해 주세요 (필터 없이)</p>
              <div className="flex gap-2">
                {/* 파일 첨부 버튼 */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="파일 첨부"
                  className={cn(
                    'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors self-end mb-0.5',
                    panelFile
                      ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800',
                  )}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input ref={fileInputRef} type="file" className="hidden"
                  accept="image/*,text/*,.pdf,.doc,.docx,.txt,.md,.csv"
                  onChange={handleFileChange} />

                <textarea
                  value={rawInput}
                  onChange={e => setRawInput(e.target.value)}
                  placeholder="준비되었습니다."
                  rows={2}
                  className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-600 text-slate-800 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleGenerate(); } }}
                />
                <button
                  onClick={() => void handleGenerate()}
                  disabled={!rawInput.trim() || isGenerating}
                  className="flex-shrink-0 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-end"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : '변환'}
                </button>
              </div>

              {generationError && (
                <div className="mt-2 flex items-start gap-1.5 px-2.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-600 dark:text-red-400 whitespace-pre-line leading-relaxed">{generationError}</p>
                </div>
              )}
            </div>

            {/* 선택지 */}
            {options.length > 0 && (
              <div className="px-4 py-3 flex-1">
                <p className="text-[10px] text-slate-400 mb-2">표현 선택</p>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <label key={i} className={cn(
                      'flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-colors text-sm',
                      selectedOption === i
                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-600'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
                    )}>
                      <input type="radio" name="etiquette-option" checked={selectedOption === i}
                        onChange={() => setSelectedOption(i)} className="mt-0.5 accent-emerald-500" />
                      <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 보내기 */}
            {options.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button onClick={handleSend} disabled={selectedOption === null}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-md shadow-primary/20">
                  <Send className="w-4 h-4" />입력창으로 보내기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
