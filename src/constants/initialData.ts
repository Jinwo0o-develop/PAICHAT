import type { Conversation } from '../types/index.ts';

const _now = Date.now();

/**
 * Vite의 import.meta.env.BASE_URL을 이용해 배포 경로에 관계없이
 * 올바른 로고 URL을 반환합니다.
 * - 개발: `/logo.png`
 * - /PAI 배포: `/PAI/logo.png`
 */
export const LOGO_URL = import.meta.env.BASE_URL + 'logo.png';

/** 앱 최초 실행 시 보여줄 샘플 대화 목록 */
export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    title: 'React Component Help',
    preview: 'How do I fix this useEffect hook?',
    messages: [
      {
        id: 'm1',
        role: 'ai',
        content:
          '안녕하세요! React와 useEffect에 대해 질문이 있으신가요? 코드를 보여주시면 도움을 드릴게요.',
        time: '2일 전',
        model: 'qwen3:4b',
      },
      { id: 'm2', role: 'user', content: 'How do I fix this useEffect hook?', time: '2일 전' },
    ],
    time: '2일 전',
    createdAt: _now - 2 * 86_400_000,
    iconType: 'code',
  },
  {
    id: '2',
    title: '여행 계획 세우기',
    preview: '제주도 3박 4일 일정 추천해줘',
    messages: [
      { id: 'm3', role: 'user', content: '제주도 3박 4일 일정 추천해줘', time: '어제' },
      {
        id: 'm4',
        role: 'ai',
        content:
          '제주도 3박 4일 여행 계획을 세워드릴게요! 1일차: 성산일출봉, 섭지코지, 우도...',
        time: '어제',
        model: 'qwen3:4b',
      },
    ],
    time: '어제',
    createdAt: _now - 86_400_000,
    iconType: 'message',
  },
  {
    id: '3',
    title: '번역 요청',
    preview: '이메일 영어로 번역 부탁해',
    messages: [
      { id: 'm5', role: 'user', content: '이메일 영어로 번역 부탁해', time: '1주 전' },
      {
        id: 'm6',
        role: 'ai',
        content: '이메일 내용을 붙여넣어 주시면 영어로 번역해 드리겠습니다.',
        time: '1주 전',
        model: 'qwen3:4b',
      },
    ],
    time: '1주 전',
    createdAt: _now - 7 * 86_400_000,
    iconType: 'languages',
  },
];
