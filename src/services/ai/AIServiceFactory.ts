import type { AIProvider, GeminiModel } from '../../types/ai.ts';
import type { AIServiceStrategy } from './types.ts';
import { OllamaService } from './OllamaService.ts';
import { GeminiService } from './GeminiService.ts';

/**
 * Factory 패턴: AIProvider + GeminiModel 조합으로 적절한 서비스 인스턴스를 반환.
 * Gemini 선택 시 내부 모델도 함께 갱신한다.
 */
export class AIServiceFactory {
  private static readonly ollama = OllamaService.getInstance();
  private static readonly gemini = GeminiService.getInstance();

  static getService(provider: AIProvider, geminiModel?: GeminiModel): AIServiceStrategy {
    if (provider === 'gemini') {
      if (geminiModel) {
        this.gemini.setModel(geminiModel);
      }
      return this.gemini;
    }
    return this.ollama;
  }

  /** 순수 Gemini 인스턴스에 접근 (모델 전환 등) */
  static getGeminiService(): GeminiService {
    return this.gemini;
  }

  /** 순수 Ollama 인스턴스에 접근 */
  static getOllamaService(): OllamaService {
    return this.ollama;
  }
}
