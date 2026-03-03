/**
 * 하위호환 re-export.
 * 새 코드는 'contexts/chat' 에서 직접 import할 것.
 */
export { ChatProvider, useChatContext } from './chat/index.ts';
export type { ChatAction } from './chat/index.ts';
