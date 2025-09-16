// Debug utility for comprehensive logging with correlation IDs
import { LogControl, type LogLevel } from './log-control';

interface LogContext {
  requestId?: string;
  userId?: string;
  storyId?: string;
  segmentId?: string;
  operation?: string;
  [key: string]: any;
}

export class DebugLogger {
  private static instance: DebugLogger;
  private isDevelopment = import.meta.env.DEV;
  private logLevel: string;

  constructor() {
    // Use LogControl for centralized log level management
    this.logLevel = LogControl.getLogLevel();
  }

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      const formattedMessage = this.formatMessage('INFO', message, context);
      console.log(formattedMessage);
    }
  }

  private shouldLog(level: string): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.logLevel as keyof typeof levels] ?? 1;
    const messageLevel = levels[level as keyof typeof levels] ?? 1;
    return messageLevel >= currentLevel;
  }

  warn(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage('WARN', message, context);
    console.warn(formattedMessage);
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error?.message || error,
      stack: error?.stack
    };
    const formattedMessage = this.formatMessage('ERROR', message, errorContext);
    console.error(formattedMessage);
    
    if (error) {
      console.error('Full error object:', error);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage('DEBUG', message, context);
      console.debug(formattedMessage);
    }
  }

  group(title: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const timestamp = new Date().toISOString();
      const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
      console.group(`[${timestamp}] ${title}${contextStr}`);
    }
  }

  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  // Specific methods for common operations
  edgeFunction(functionName: string, requestId: string, body: any): void {
    this.info(`🚀 Calling edge function: ${functionName}`, {
      requestId,
      function: functionName,
      bodyKeys: Object.keys(body || {})
    });
  }

  edgeFunctionResponse(functionName: string, requestId: string, response: any, error?: any): void {
    if (error) {
      this.error(`❌ Edge function failed: ${functionName}`, error, {
        requestId,
        function: functionName,
        response
      });
    } else {
      this.info(`✅ Edge function success: ${functionName}`, {
        requestId,
        function: functionName,
        responseKeys: response ? Object.keys(response) : []
      });
    }
  }

  storySegmentGeneration(storyId: string, segmentNumber: number, requestId: string): void {
    this.info(`📖 Starting story segment generation`, {
      requestId,
      storyId,
      segmentNumber,
      operation: 'segment-generation'
    });
  }

  imageGeneration(segmentId: string, requestId: string, attempt: number = 1): void {
    this.info(`🎨 Starting image generation`, {
      requestId,
      segmentId,
      attempt,
      operation: 'image-generation'
    });
  }

  audioGeneration(segmentId: string, requestId: string, voiceId: string, attempt: number = 1): void {
    this.info(`🎵 Starting audio generation`, {
      requestId,
      segmentId,
      voiceId,
      attempt,
      operation: 'audio-generation'
    });
  }
}

// Utility functions
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createLogger(): DebugLogger {
  return DebugLogger.getInstance();
}

// Export singleton instance
export const logger = DebugLogger.getInstance();