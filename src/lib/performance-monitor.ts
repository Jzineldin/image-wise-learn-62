/**
 * Performance Monitoring Utilities
 * 
 * Provides tools for tracking performance metrics and user actions
 */

import { logger } from '@/lib/logger';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Track page load performance
   */
  trackPageLoad(pageName: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        
        logger.performance(`Page load: ${pageName}`, loadTime, {
          page: pageName,
          domContentLoaded,
          networkTime: navigation.responseEnd - navigation.fetchStart,
          renderTime: navigation.loadEventEnd - navigation.responseEnd
        });
      }
    }
  }

  /**
   * Track user interactions with timing
   */
  trackUserAction(action: string, startTime: number, context?: Record<string, any>): void {
    const duration = Date.now() - startTime;
    logger.userAction(action, { ...context, duration });
  }

  /**
   * Track API call performance
   */
  trackAPICall(endpoint: string, startTime: number, success: boolean, context?: Record<string, any>): void {
    const duration = Date.now() - startTime;
    logger.performance(`API call: ${endpoint}`, duration, {
      ...context,
      endpoint,
      success,
      operation: 'api_call'
    });
  }

  /**
   * Track story generation performance
   */
  trackStoryGeneration(type: 'story' | 'segment' | 'image' | 'audio', startTime: number, success: boolean, context?: Record<string, any>): void {
    const duration = Date.now() - startTime;
    logger.performance(`${type} generation`, duration, {
      ...context,
      type,
      success,
      operation: 'story_generation'
    });
  }

  /**
   * Track React Query cache performance
   */
  trackCacheHit(queryKey: string, isHit: boolean): void {
    logger.debug('React Query cache', {
      queryKey,
      cacheHit: isHit,
      operation: 'cache_performance'
    });
  }

  /**
   * Monitor bundle size impact
   */
  trackBundleMetrics(): void {
    if (typeof window !== 'undefined') {
      // Track initial bundle load performance
      const paintEntries = performance.getEntriesByType('paint');
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
      const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');

      if (firstPaint && firstContentfulPaint) {
        logger.performance('Bundle metrics', 0, {
          firstPaint: firstPaint.startTime,
          firstContentfulPaint: firstContentfulPaint.startTime,
          operation: 'bundle_performance'
        });
      }
    }
  }

  /**
   * Get memory usage information (development only)
   */
  getMemoryUsage(): Record<string, any> | null {
    if (typeof window !== 'undefined' && 'memory' in window.performance) {
      const memory = (window.performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }
}

/**
 * React Hook for Performance Tracking
 */
export function usePerformanceTracker() {
  const monitor = PerformanceMonitor.getInstance();

  const trackAction = (action: string, context?: Record<string, any>) => {
    const startTime = Date.now();
    return {
      finish: (success: boolean = true) => {
        monitor.trackUserAction(action, startTime, { ...context, success });
      }
    };
  };

  const trackAPICall = (endpoint: string, context?: Record<string, any>) => {
    const startTime = Date.now();
    return {
      finish: (success: boolean, additionalContext?: Record<string, any>) => {
        monitor.trackAPICall(endpoint, startTime, success, { ...context, ...additionalContext });
      }
    };
  };

  return {
    trackAction,
    trackAPICall,
    trackPageLoad: monitor.trackPageLoad.bind(monitor),
    trackStoryGeneration: monitor.trackStoryGeneration.bind(monitor),
    getMemoryUsage: monitor.getMemoryUsage.bind(monitor)
  };
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();