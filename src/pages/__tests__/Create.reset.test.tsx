import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateStoryFlow from '../Create';
import { useStoryStore } from '@/stores/storyStore';

// Mocks for modules used by Create
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'u_test' } }) }));
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ translate: (k: string) => k, selectedLanguage: 'en', changeLanguage: () => {} })
}));
vi.mock('@/components/CreditDisplay', () => ({ default: () => <div /> }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }) } }));
vi.mock('@/lib/utils/debug', () => ({ logger: { edgeFunction: () => {}, edgeFunctionResponse: () => {}, error: () => {} }, generateRequestId: () => 'req_test' }));
vi.mock('@/lib/api/ai-client', () => ({ AIClient: { generateStory: async () => ({ data: {} }) } , InsufficientCreditsError: class {} }));

describe('Create page wizard reset', () => {
  beforeEach(() => {
    const s = useStoryStore.getState();
    // Simulate user left in step 4 from a previous session
    useStoryStore.setState({
      currentFlow: {
        ...s.currentFlow,
        step: 4,
        ageGroup: undefined,
        genres: [],
        selectedCharacters: [],
        selectedSeed: undefined,
        customSeed: ''
      }
    });
  });

  it('resets to step 1 on mount', async () => {
    render(
      <MemoryRouter initialEntries={["/create"]}>
        <CreateStoryFlow />
      </MemoryRouter>
    );

    await waitFor(() => {
      const step = useStoryStore.getState().currentFlow.step;
      expect(step).toBe(1);
    });

    // Also verify the Age & Genre step content is rendered
    expect(await screen.findByTestId('wizard-step-age-genre')).toBeInTheDocument();
  });
});

