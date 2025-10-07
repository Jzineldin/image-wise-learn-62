import { vi } from 'vitest';

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    }))
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        order: vi.fn(() => ({
          limit: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn()
    })),
    delete: vi.fn(() => ({
      eq: vi.fn()
    }))
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'mock-url' } })),
      remove: vi.fn()
    }))
  },
  functions: {
    invoke: vi.fn()
  }
};

// Mock createClient function
export const mockCreateClient = vi.fn(() => mockSupabaseClient);

// Mock the entire @supabase/supabase-js module
vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient
}));

// Helper to reset all mocks
export const resetSupabaseMocks = () => {
  Object.values(mockSupabaseClient).forEach(mock => {
    if (typeof mock === 'object' && mock !== null) {
      Object.values(mock).forEach(method => {
        if (vi.isMockFunction(method)) {
          method.mockReset();
        }
      });
    }
  });
  mockCreateClient.mockReset();
};

// Helper to setup authenticated user
export const setupAuthenticatedUser = (user = { id: 'test-user-123', email: 'test@example.com' }) => {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user },
    error: null
  });
};

// Helper to setup anonymous user
export const setupAnonymousUser = () => {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null
  });
};

// Helper to mock database responses
export const mockDatabaseResponse = (table: string, operation: string, response: any) => {
  // For simplicity, just mock the from function to return the response
  mockSupabaseClient.from.mockReturnValueOnce(response);
};

// Helper to mock function invocations
export const mockFunctionResponse = (functionName: string, response: any) => {
  mockSupabaseClient.functions.invoke.mockImplementation((name: string) => {
    if (name === functionName) {
      return Promise.resolve({ data: response, error: null });
    }
    return Promise.resolve({ data: null, error: { message: 'Function not found' } });
  });
};

// Helper to mock function errors
export const mockFunctionError = (functionName: string, error: any) => {
  mockSupabaseClient.functions.invoke.mockImplementation((name: string) => {
    if (name === functionName) {
      return Promise.resolve({ data: null, error });
    }
    return Promise.resolve({ data: null, error: { message: 'Function not found' } });
  });
};