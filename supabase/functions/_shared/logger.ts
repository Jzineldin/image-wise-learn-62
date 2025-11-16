// Simple structured logger for edge functions
export class EdgeLogger {
  // Ultra-safe stringify - catches ALL errors and handles circular refs
  private static safeStringify(obj: any): string {
    try {
      const seen = new WeakSet();
      return JSON.stringify(obj, (key, value) => {
        // Handle circular references
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        // Handle functions
        if (typeof value === 'function') {
          return '[Function]';
        }
        // Handle symbols
        if (typeof value === 'symbol') {
          return '[Symbol]';
        }
        return value;
      });
    } catch (e) {
      // If even that fails, return a safe string
      try {
        return String(obj);
      } catch {
        return '[Unstringifiable]';
      }
    }
  }

  static info(message: string, context?: Record<string, any>): void {
    try {
      const timestamp = new Date().toISOString();
      const contextStr = context ? ` | ${this.safeStringify(context)}` : '';
      console.log(`[${timestamp}] [INFO] ${message}${contextStr}`);
    } catch (e) {
      // If logging fails, at least try to log the message
      console.log(`[ERROR IN LOGGER] ${message}`);
    }
  }

  static warn(message: string, context?: Record<string, any>): void {
    try {
      const timestamp = new Date().toISOString();
      const contextStr = context ? ` | ${this.safeStringify(context)}` : '';
      console.warn(`[${timestamp}] [WARN] ${message}${contextStr}`);
    } catch (e) {
      console.warn(`[ERROR IN LOGGER] ${message}`);
    }
  }

  static error(message: string, error?: Error | any, context?: Record<string, any>): void {
    try {
      const timestamp = new Date().toISOString();
      const errorContext = {
        ...context,
        error: error?.message || error,
        stack: error?.stack
      };
      const contextStr = ` | ${this.safeStringify(errorContext)}`;
      console.error(`[${timestamp}] [ERROR] ${message}${contextStr}`);

      if (error && error.stack) {
        console.error('Stack trace:', error.stack);
      }
    } catch (e) {
      console.error(`[ERROR IN LOGGER] ${message}`);
    }
  }

  static debug(message: string, context?: Record<string, any>): void {
    try {
      const timestamp = new Date().toISOString();
      const contextStr = context ? ` | ${this.safeStringify(context)}` : '';
      console.debug(`[${timestamp}] [DEBUG] ${message}${contextStr}`);
    } catch (e) {
      console.debug(`[ERROR IN LOGGER] ${message}`);
    }
  }

  // Specific methods for common operations
  static edgeFunction(functionName: string, requestId: string, body: any): void {
    this.info(`🚀 Edge function called: ${functionName}`, {
      requestId,
      function: functionName,
      bodyKeys: Object.keys(body || {})
    });
  }

  static audioGeneration(segmentId: string, requestId: string, voiceId: string): void {
    this.info(`🎵 Audio generation started`, {
      requestId,
      segmentId,
      voiceId,
      operation: 'audio-generation'
    });
  }

  static storySegmentGeneration(storyId: string, segmentNumber: number, requestId: string): void {
    this.info(`📖 Story segment generation started`, {
      requestId,
      storyId,
      segmentNumber,
      operation: 'segment-generation'
    });
  }

  static imageGeneration(segmentId: string, requestId: string): void {
    this.info(`🎨 Image generation started`, {
      requestId,
      segmentId,
      operation: 'image-generation'
    });
  }
}

export const logger = EdgeLogger;