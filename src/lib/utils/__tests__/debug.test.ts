import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DebugLogger, generateRequestId, createLogger, logger } from '../debug';

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  group: vi.fn(),
  groupEnd: vi.fn(),
};

// Mock import.meta.env
vi.mock('import.meta.env', () => ({
  DEV: true
}));

describe('DebugLogger', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Mock console methods
    global.console = mockConsole as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const logger1 = DebugLogger.getInstance();
      const logger2 = DebugLogger.getInstance();
      
      expect(logger1).toBe(logger2);
    });

    it('should create logger with createLogger function', () => {
      const createdLogger = createLogger();
      const instance = DebugLogger.getInstance();
      
      expect(createdLogger).toBe(instance);
    });

    it('should export singleton instance', () => {
      expect(logger).toBe(DebugLogger.getInstance());
    });
  });

  describe('logging methods', () => {
    let debugLogger: DebugLogger;

    beforeEach(() => {
      debugLogger = new DebugLogger();
    });

    describe('info', () => {
      it('should log info messages with correct format', () => {
        const message = 'Test info message';
        const context = { userId: 'test-123' };
        
        debugLogger.info(message, context);
        
        expect(mockConsole.log).toHaveBeenCalledWith(
          expect.stringMatching(/\[.*\] \[INFO\] Test info message \| Context: {"userId":"test-123"}/)
        );
      });

      it('should log info messages without context', () => {
        const message = 'Test info message';
        
        debugLogger.info(message);
        
        expect(mockConsole.log).toHaveBeenCalledWith(
          expect.stringMatching(/\[.*\] \[INFO\] Test info message$/)
        );
      });
    });

    describe('warn', () => {
      it('should log warning messages', () => {
        const message = 'Test warning';
        const context = { operation: 'test-op' };
        
        debugLogger.warn(message, context);
        
        expect(mockConsole.warn).toHaveBeenCalledWith(
          expect.stringMatching(/\[.*\] \[WARN\] Test warning \| Context: {"operation":"test-op"}/)
        );
      });
    });

    describe('error', () => {
      it('should log error messages with Error object', () => {
        const message = 'Test error';
        const error = new Error('Test error details');
        const context = { requestId: 'req-123' };
        
        debugLogger.error(message, error, context);
        
        expect(mockConsole.error).toHaveBeenCalledWith(
          expect.stringMatching(/\[.*\] \[ERROR\] Test error \| Context:/)
        );
        expect(mockConsole.error).toHaveBeenCalledWith(
          'Full error object:', error
        );
      });

      it('should log error messages without Error object', () => {
        const message = 'Test error';
        
        debugLogger.error(message);
        
        expect(mockConsole.error).toHaveBeenCalledWith(
          expect.stringMatching(/\[.*\] \[ERROR\] Test error$/)
        );
      });
    });

    describe('debug', () => {
      it('should log debug messages in development', () => {
        const message = 'Debug message';
        const context = { debugInfo: 'test' };
        
        debugLogger.debug(message, context);
        
        expect(mockConsole.debug).toHaveBeenCalledWith(
          expect.stringMatching(/\[.*\] \[DEBUG\] Debug message \| Context: {"debugInfo":"test"}/)
        );
      });
    });

    describe('group', () => {
      it('should create console group in development', () => {
        const title = 'Test Group';
        const context = { groupId: 'group-1' };
        
        debugLogger.group(title, context);
        
        expect(mockConsole.group).toHaveBeenCalledWith(
          expect.stringMatching(/\[.*\] Test Group \| {"groupId":"group-1"}/)
        );
      });
    });

    describe('groupEnd', () => {
      it('should end console group in development', () => {
        debugLogger.groupEnd();
        
        expect(mockConsole.groupEnd).toHaveBeenCalled();
      });
    });
  });

  describe('specific operation methods', () => {
    let debugLogger: DebugLogger;

    beforeEach(() => {
      debugLogger = new DebugLogger();
    });

    describe('edgeFunction', () => {
      it('should log edge function call', () => {
        const functionName = 'test-function';
        const requestId = 'req-123';
        const body = { param1: 'value1', param2: 'value2' };
        
        debugLogger.edgeFunction(functionName, requestId, body);
        
        expect(mockConsole.log).toHaveBeenCalledWith(
          expect.stringMatching(/🚀 Calling edge function: test-function/)
        );
      });
    });

    describe('storySegmentGeneration', () => {
      it('should log story segment generation', () => {
        const storyId = 'story-123';
        const segmentNumber = 1;
        const requestId = 'req-123';
        
        debugLogger.storySegmentGeneration(storyId, segmentNumber, requestId);
        
        expect(mockConsole.log).toHaveBeenCalledWith(
          expect.stringMatching(/📖 Starting story segment generation/)
        );
      });
    });

    describe('imageGeneration', () => {
      it('should log image generation', () => {
        const segmentId = 'segment-123';
        const requestId = 'req-123';
        const attempt = 2;
        
        debugLogger.imageGeneration(segmentId, requestId, attempt);
        
        expect(mockConsole.log).toHaveBeenCalledWith(
          expect.stringMatching(/🎨 Starting image generation/)
        );
      });
    });

    describe('audioGeneration', () => {
      it('should log audio generation', () => {
        const segmentId = 'segment-123';
        const requestId = 'req-123';
        const voiceId = 'voice-456';
        const attempt = 1;
        
        debugLogger.audioGeneration(segmentId, requestId, voiceId, attempt);
        
        expect(mockConsole.log).toHaveBeenCalledWith(
          expect.stringMatching(/🎵 Starting audio generation/)
        );
      });
    });
  });
});

describe('generateRequestId', () => {
  it('should generate unique request IDs', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();
    
    expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
    expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });

  it('should have correct format', () => {
    const id = generateRequestId();
    
    expect(id).toMatch(/^req_\d{13}_[a-z0-9]{9}$/);
  });
});