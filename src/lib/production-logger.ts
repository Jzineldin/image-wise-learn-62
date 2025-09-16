/**
 * Production Logger System
 * 
 * A centralized logging system with proper level control,
 * performance tracking, and error reporting capabilities.
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

class ProductionLogger {
  private static instance: ProductionLogger;
  
  static getInstance(): ProductionLogger {
    if (!ProductionLogger.instance) {
      ProductionLogger.instance = new ProductionLogger();
    }
    return ProductionLogger.instance;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext): void {
    if (LogControl.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (LogControl.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    if (LogControl.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error?.message || error,
        stack: error?.stack
      };
      console.error(this.formatMessage('error', message, errorContext));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (LogControl.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  // Performance logging
  time(operation: string): string {
    const requestId = `${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.time(requestId);
    return requestId;
  }

  timeEnd(requestId: string, operation: string, context?: LogContext): void {
    console.timeEnd(requestId);
    this.info(`Operation completed: ${operation}`, {
      ...context,
      requestId,
      operation
    });
  }

  // API call logging
  apiCall(method: string, url: string, context?: LogContext): void {
    this.info(`API ${method} ${url}`, {
      ...context,
      operation: 'api-call',
      method,
      url
    });
  }

  apiResponse(method: string, url: string, status: number, duration: number, context?: LogContext): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this[level](`API ${method} ${url} - ${status}`, {
      ...context,
      operation: 'api-response',
      method,
      url,
      status,
      duration
    });
  }

  // Component lifecycle logging
  componentMount(componentName: string, context?: LogContext): void {
    this.debug(`Component mounted: ${componentName}`, {
      ...context,
      operation: 'component-mount',
      component: componentName
    });
  }

  componentUnmount(componentName: string, context?: LogContext): void {
    this.debug(`Component unmounted: ${componentName}`, {
      ...context,
      operation: 'component-unmount',
      component: componentName
    });
  }

  // User action logging
  userAction(action: string, context?: LogContext): void {
    this.info(`User action: ${action}`, {
      ...context,
      operation: 'user-action',
      action
    });
  }

  // Story-specific logging
  storyGeneration(storyId: string, stage: string, context?: LogContext): void {
    this.info(`Story generation - ${stage}`, {
      ...context,
      operation: 'story-generation',
      storyId,
      stage
    });
  }

  audioGeneration(segmentId: string, status: string, context?: LogContext): void {
    this.info(`Audio generation - ${status}`, {
      ...context,
      operation: 'audio-generation',
      segmentId,
      status
    });
  }

  imageGeneration(segmentId: string, status: string, context?: LogContext): void {
    this.info(`Image generation - ${status}`, {
      ...context,
      operation: 'image-generation',
      segmentId,
      status
    });
  }
}

// Export singleton instance
export const logger = ProductionLogger.getInstance();

// Export for specific use cases
export { ProductionLogger, type LogContext };