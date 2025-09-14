// Simple structured logger for edge functions
export class EdgeLogger {
  static info(message: string, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    console.log(`[${timestamp}] [INFO] ${message}${contextStr}`);
  }

  static warn(message: string, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    console.warn(`[${timestamp}] [WARN] ${message}${contextStr}`);
  }

  static error(message: string, error?: Error | any, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const errorContext = {
      ...context,
      error: error?.message || error,
      stack: error?.stack
    };
    const contextStr = ` | ${JSON.stringify(errorContext)}`;
    console.error(`[${timestamp}] [ERROR] ${message}${contextStr}`);
    
    if (error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }

  static debug(message: string, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    console.debug(`[${timestamp}] [DEBUG] ${message}${contextStr}`);
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