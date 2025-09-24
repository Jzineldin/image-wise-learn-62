/**
 * Centralized Logging System
 * Replaces scattered console.log statements with structured logging
 */

import { LogControl, type LogLevel } from './log-control';

interface LogContext {
  requestId?: string;
  userId?: string;
  storyId?: string;
  segmentId?: string;
  operation?: string;
  component?: string;
  duration?: number;
  [key: string]: any;
}

class Logger {
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return LogControl.shouldLog(level);
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error?.message || error,
        stack: error?.stack
      };
      console.error(this.formatMessage('error', message, errorContext));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  // Specific logging methods for common operations
  apiCall(functionName: string, context?: LogContext): void {
    this.info(`🚀 API call: ${functionName}`, { 
      ...context, 
      operation: 'api_call',
      requestId: context?.requestId || this.generateRequestId()
    });
  }

  apiResponse(functionName: string, success: boolean, context?: LogContext): void {
    if (success) {
      this.info(`✅ API success: ${functionName}`, { ...context, operation: 'api_response' });
    } else {
      this.error(`❌ API error: ${functionName}`, undefined, { ...context, operation: 'api_response' });
    }
  }

  imageGeneration(segmentId: string, context?: LogContext): void {
    this.info(`🎨 Image generation started`, { 
      ...context, 
      segmentId, 
      operation: 'image_generation' 
    });
  }

  audioGeneration(segmentId: string, context?: LogContext): void {
    this.info(`🎵 Audio generation started`, { 
      ...context, 
      segmentId, 
      operation: 'audio_generation' 
    });
  }

  storyGeneration(storyId: string, context?: LogContext): void {
    this.info(`📖 Story generation started`, {
      ...context,
      storyId,
      operation: 'story_generation'
    });
  }

  performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`⏱️ Performance: ${operation}`, {
      ...context,
      duration,
      operation: 'performance'
    });
  }

  userAction(action: string, context?: LogContext): void {
    this.info(`👤 User action: ${action}`, {
      ...context,
      operation: 'user_action'
    });
  }
}

export const logger = new Logger();