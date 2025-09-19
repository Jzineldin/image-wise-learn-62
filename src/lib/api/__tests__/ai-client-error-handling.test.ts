/**
 * Test Context7 Error Handling Patterns in AIClient
 * Based on Context7 MCP documentation from supabase-edge-functions.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';
import { AIClient, AIClientError, InsufficientCreditsError } from '../ai-client';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn()
    },
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('AIClient Context7 Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset circuit breaker state
    (AIClient as any).failureCount.clear();
    (AIClient as any).lastFailureTime.clear();
  });

  describe('Context7 Pattern: FunctionsHttpError handling', () => {
    it('should handle FunctionsHttpError with error context', async () => {
      const mockError = new FunctionsHttpError(
        'Function error',
        { 
          status: 400,
          json: () => Promise.resolve({ error: 'Invalid input', code: 'VALIDATION_ERROR' })
        } as any
      );

      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null
      });
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(AIClient.invoke('test-function', {})).rejects.toThrow(AIClientError);
      
      try {
        await AIClient.invoke('test-function', {});
      } catch (error) {
        expect(error).toBeInstanceOf(AIClientError);
        expect((error as AIClientError).code).toBe('FUNCTION_ERROR');
        expect((error as AIClientError).message).toBe('Invalid input');
      }
    });

    it('should handle insufficient credits from function response', async () => {
      const mockError = new FunctionsHttpError(
        'Credit error',
        { 
          status: 400,
          json: () => Promise.resolve({ 
            error: 'Insufficient credits. Required: 5, Available: 2' 
          })
        } as any
      );

      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null
      });
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(AIClient.invoke('test-function', {})).rejects.toThrow(InsufficientCreditsError);
      
      try {
        await AIClient.invoke('test-function', {});
      } catch (error) {
        expect(error).toBeInstanceOf(InsufficientCreditsError);
        expect((error as InsufficientCreditsError).required).toBe(5);
        expect((error as InsufficientCreditsError).available).toBe(2);
      }
    });
  });

  describe('Context7 Pattern: FunctionsRelayError handling', () => {
    it('should handle FunctionsRelayError as network error', async () => {
      const mockError = new FunctionsRelayError('Network timeout');

      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null
      });
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(AIClient.invoke('test-function', {})).rejects.toThrow(AIClientError);
      
      try {
        await AIClient.invoke('test-function', {});
      } catch (error) {
        expect(error).toBeInstanceOf(AIClientError);
        expect((error as AIClientError).code).toBe('NETWORK_ERROR');
        expect((error as AIClientError).message).toBe('Network error occurred. Please check your connection and try again.');
      }
    });
  });

  describe('Context7 Pattern: FunctionsFetchError handling', () => {
    it('should handle FunctionsFetchError as service unavailable', async () => {
      const mockError = new FunctionsFetchError('Service unreachable');

      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null
      });
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(AIClient.invoke('test-function', {})).rejects.toThrow(AIClientError);
      
      try {
        await AIClient.invoke('test-function', {});
      } catch (error) {
        expect(error).toBeInstanceOf(AIClientError);
        expect((error as AIClientError).code).toBe('SERVICE_UNAVAILABLE');
        expect((error as AIClientError).message).toBe('Service temporarily unavailable. Please try again in a moment.');
      }
    });
  });

  describe('Context7 Pattern: Retry logic', () => {
    it('should retry network errors but not function errors', async () => {
      const networkError = new FunctionsRelayError('Network timeout');
      const functionError = new FunctionsHttpError(
        'Function error',
        { 
          status: 400,
          json: () => Promise.resolve({ error: 'Invalid input' })
        } as any
      );

      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null
      });

      // Test network error retry
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: networkError
      });

      const networkErrorPromise = AIClient.invoke('test-function', {}, { retries: 2 });
      await expect(networkErrorPromise).rejects.toThrow('NETWORK_ERROR');
      
      // Should have called invoke 3 times (1 initial + 2 retries)
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(3);

      // Reset mock
      vi.clearAllMocks();
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null
      });

      // Test function error no retry
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: functionError
      });

      const functionErrorPromise = AIClient.invoke('test-function', {}, { retries: 2 });
      await expect(functionErrorPromise).rejects.toThrow('FUNCTION_ERROR');
      
      // Should have called invoke only 1 time (no retries for function errors)
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
    });
  });

  describe('Retry logic for different error codes', () => {
    it('should identify retryable vs non-retryable errors correctly', () => {
      // Access private method for testing
      const isRetryableError = (AIClient as any).isRetryableError;

      // Retryable errors (Context7 pattern)
      expect(isRetryableError(new AIClientError('Network error', 'NETWORK_ERROR', 503))).toBe(true);
      expect(isRetryableError(new AIClientError('Service unavailable', 'SERVICE_UNAVAILABLE', 503))).toBe(true);
      expect(isRetryableError(new AIClientError('Timeout', 'TIMEOUT', 408))).toBe(true);

      // Non-retryable errors (Context7 pattern)
      expect(isRetryableError(new AIClientError('Function error', 'FUNCTION_ERROR', 400))).toBe(false);
      expect(isRetryableError(new AIClientError('Auth required', 'AUTH_REQUIRED', 401))).toBe(false);
      expect(isRetryableError(new AIClientError('Insufficient credits', 'INSUFFICIENT_CREDITS', 400))).toBe(false);
      expect(isRetryableError(new AIClientError('Validation error', 'VALIDATION_ERROR', 400))).toBe(false);
    });
  });
});
