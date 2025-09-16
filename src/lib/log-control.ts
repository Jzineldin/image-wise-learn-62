/**
 * Log Level Control Utility
 * 
 * Allows users and developers to control logging levels at runtime
 * without relying on build-time environment variables.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class LogControl {
  private static readonly STORAGE_KEY = 'debug-log-level';
  
  /**
   * Set log level (persisted in localStorage)
   */
  static setLogLevel(level: LogLevel): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, level);
      console.log(`Log level set to: ${level}`);
    } catch (error) {
      console.warn('Failed to save log level to localStorage:', error);
    }
  }

  /**
   * Get current log level
   */
  static getLogLevel(): LogLevel {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored && ['debug', 'info', 'warn', 'error'].includes(stored)) {
        return stored as LogLevel;
      }
    } catch (error) {
      // localStorage not available
    }
    
    // Default based on environment
    return import.meta.env.DEV ? 'info' : 'warn';
  }

  /**
   * Check if a message should be logged based on current level
   */
  static shouldLog(messageLevel: LogLevel): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.getLogLevel()];
    const messageLevelNum = levels[messageLevel];
    return messageLevelNum >= currentLevel;
  }

  /**
   * Reduce console noise for production
   */
  static enableQuietMode(): void {
    this.setLogLevel('error');
  }

  /**
   * Enable verbose logging for debugging
   */
  static enableVerboseMode(): void {
    this.setLogLevel('debug');
  }

  /**
   * Reset to default log level
   */
  static resetLogLevel(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('Log level reset to default');
    } catch (error) {
      console.warn('Failed to reset log level:', error);
    }
  }
}

// Expose global functions for easy console access
if (typeof window !== 'undefined') {
  (window as any).setLogLevel = LogControl.setLogLevel.bind(LogControl);
  (window as any).quietMode = LogControl.enableQuietMode.bind(LogControl);
  (window as any).verboseMode = LogControl.enableVerboseMode.bind(LogControl);
}