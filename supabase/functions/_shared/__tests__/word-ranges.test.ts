import { describe, it, expect } from 'vitest';
import { AGE_GUIDELINES } from '../prompt-templates.ts';
import { parseWordRange } from '../response-handlers.ts';

describe('AGE_GUIDELINES word ranges', () => {
  it('matches updated ranges', () => {
    expect(AGE_GUIDELINES['4-6'].wordCount).toBe('30-60 words');
    expect(AGE_GUIDELINES['7-9'].wordCount).toBe('80-110 words');
    expect(AGE_GUIDELINES['10-12'].wordCount).toBe('120-150 words');
    expect(AGE_GUIDELINES['13+'].wordCount).toBe('150-200 words');
  });
});

describe('parseWordRange utility', () => {
  it('parses min and max from range string', () => {
    const { min, max } = parseWordRange('80-110 words');
    expect(min).toBe(80);
    expect(max).toBe(110);
  });
});

