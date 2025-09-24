import { describe, it, expect } from 'vitest';
import { MODEL_CONFIGS, AI_PROVIDERS } from '../ai-service.ts';

describe('AI model configuration', () => {
  it('uses x-ai/grok-4-fast:free for story-segments via OpenRouter', () => {
    const cfg = MODEL_CONFIGS['story-segments'];
    expect(cfg).toBeTruthy();
    expect(cfg.provider).toBe('openrouter');
    expect(cfg.model).toBe('x-ai/grok-4-fast:free');
    const openrouter = AI_PROVIDERS['openrouter'];
    expect(openrouter.defaultModel).toBe('x-ai/grok-4-fast:free');
  });
});

