/**
 * 하위호환 re-export.
 * 새 코드는 'services/ai' 에서 직접 import할 것.
 */
export { OllamaService, OLLAMA_MODEL as MODEL } from './ai/OllamaService.ts';
export type { ChatMessage as OllamaMessage } from '../types/ai.ts';
