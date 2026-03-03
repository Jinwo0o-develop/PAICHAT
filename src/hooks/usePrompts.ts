import { useState, useCallback } from 'react';
import type { Prompt } from '../types/prompt.ts';
import { generateRandomId } from '../lib/id.ts';

const STORAGE_KEY = 'pai_prompts';

// ─── 시드 데이터 ──────────────────────────────────────────────────────────────

const SEED_PROMPTS: Prompt[] = [
  {
    id: 'seed-1',
    name: '창의적인 글쓰기 도우미',
    description: '소설, 에세이 작성 보조',
    content:
      '당신은 창의적인 글쓰기 전문가입니다. 사용자의 글쓰기를 도와주세요. 소설, 에세이, 시 등 다양한 형식의 글을 작성하는 데 도움을 드립니다. 문체와 표현을 풍부하게 하고, 독자의 감정을 자극하는 글을 만들어주세요.',
    createdAt: Date.now() - 86_400_000 * 5,
    usageCount: 0,
  },
  {
    id: 'seed-2',
    name: '코드 리뷰어',
    description: '코드 품질 개선 및 버그 찾기',
    content:
      '당신은 10년 경력의 시니어 개발자입니다. 사용자의 코드를 검토하고 개선점을 제안해 주세요. 버그, 성능 이슈, 코드 가독성, 보안 취약점 등을 분석하고 구체적인 수정 방안을 제시해주세요.',
    createdAt: Date.now() - 86_400_000 * 3,
    usageCount: 0,
  },
  {
    id: 'seed-3',
    name: '비즈니스 이메일 작성',
    description: '전문적인 비즈니스 이메일 초안',
    content:
      '당신은 비즈니스 커뮤니케이션 전문가입니다. 전문적이고 명확한 비즈니스 이메일을 작성해 주세요. 상황에 맞는 격식체를 사용하고, 요점을 명확히 전달하면서도 예의 바른 톤을 유지해주세요.',
    createdAt: Date.now() - 86_400_000 * 1,
    usageCount: 0,
  },
];

// ─── 로컬스토리지 헬퍼 ────────────────────────────────────────────────────────

function loadPrompts(): Prompt[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as Prompt[];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PROMPTS));
    return SEED_PROMPTS;
  } catch {
    return SEED_PROMPTS;
  }
}

function persist(prompts: Prompt[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  } catch { /* ignore */ }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>(loadPrompts);

  const createPrompt = useCallback(
    (name: string, description: string, content: string) => {
      const p: Prompt = {
        id: generateRandomId(),
        name: name.trim(),
        description: description.trim(),
        content: content.trim(),
        createdAt: Date.now(),
        usageCount: 0,
      };
      setPrompts((prev) => {
        const next = [p, ...prev];
        persist(next);
        return next;
      });
    },
    [],
  );

  const deletePrompt = useCallback((id: string) => {
    setPrompts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const markUsed = useCallback((id: string) => {
    setPrompts((prev) => {
      const next = prev.map((p) =>
        p.id === id
          ? { ...p, lastUsedAt: Date.now(), usageCount: p.usageCount + 1 }
          : p,
      );
      persist(next);
      return next;
    });
  }, []);

  const updatePrompt = useCallback(
    (id: string, name: string, description: string, content: string) => {
      setPrompts((prev) => {
        const next = prev.map((p) =>
          p.id === id
            ? { ...p, name: name.trim(), description: description.trim(), content: content.trim() }
            : p,
        );
        persist(next);
        return next;
      });
    },
    [],
  );

  // 최근 사용 2개 (사용 이력 없으면 최신 생성 순 2개)
  const usedSorted = prompts
    .filter((p) => p.lastUsedAt)
    .sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0));

  const recentPrompts =
    usedSorted.length > 0
      ? usedSorted.slice(0, 2)
      : [...prompts].sort((a, b) => b.createdAt - a.createdAt).slice(0, 2);

  return { prompts, recentPrompts, createPrompt, deletePrompt, markUsed, updatePrompt };
}
