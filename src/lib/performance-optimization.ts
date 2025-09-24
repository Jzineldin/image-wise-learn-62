/**
 * Performance optimization utilities
 * Provides recommendations and optimizations for production builds
 */

import { logger } from './logger';

interface BundleAnalysis {
  initialBundleSize: number;
  asyncChunks: number;
  cacheHitRate: number;
  recommendations: string[];
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private bundleSize = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Track bundle size for analysis
   */
  trackBundleSize(size: number): void {
    this.bundleSize = size;
    logger.performance('Bundle size tracked', size, {
      operation: 'bundle_analysis'
    });
  }

  /**
   * Track cache performance
   */
  trackCacheHit(): void {
    this.cacheHits++;
  }

  trackCacheMiss(): void {
    this.cacheMisses++;
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;

    // Bundle size recommendations
    if (this.bundleSize > 1024 * 1024) { // > 1MB
      recommendations.push('Consider code splitting to reduce initial bundle size');
    }

    if (this.bundleSize > 2 * 1024 * 1024) { // > 2MB
      recommendations.push('Bundle size is quite large - implement dynamic imports for routes');
    }

    // Cache performance recommendations
    if (hitRate < 70) {
      recommendations.push('React Query cache hit rate is low - consider increasing staleTime');
    }

    if (hitRate > 95) {
      recommendations.push('Excellent cache performance! Consider reducing gcTime to free memory');
    }

    // Memory recommendations
    if (this.getMemoryUsage() > 100) { // > 100MB
      recommendations.push('High memory usage detected - consider implementing virtualization for large lists');
    }

    return recommendations;
  }

  /**
   * Get current memory usage (development only)
   */
  private getMemoryUsage(): number {
    if (import.meta.env.DEV && 'memory' in performance) {
      return (performance as any).memory?.usedJSHeapSize / (1024 * 1024) || 0;
    }
    return 0;
  }

  /**
   * Generate performance report
   */
  generateReport(): BundleAnalysis {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const cacheHitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;

    const report: BundleAnalysis = {
      initialBundleSize: this.bundleSize,
      asyncChunks: 0, // Would need build-time analysis
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      recommendations: this.getRecommendations(),
    };

    logger.performance('Performance report generated', 0, {
      operation: 'performance_report',
      bundleSize: this.bundleSize,
      cacheHitRate,
      recommendationsCount: report.recommendations.length
    });

    return report;
  }

  /**
   * Enable performance monitoring in production
   */
  enableProductionMonitoring(): void {
    if (import.meta.env.PROD) {
      // Track long tasks
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) { // Tasks longer than 50ms
              logger.warn('Long task detected', {
                duration: entry.duration,
                startTime: entry.startTime,
                operation: 'long_task_detection'
              });
            }
          });
        });

        try {
          observer.observe({ entryTypes: ['longtask'] });
        } catch (e) {
          // Long task observer not supported
        }
      }

      // Track layout shifts
      if ('PerformanceObserver' in window) {
        const clsObserver = new PerformanceObserver((list) => {
          let cls = 0;
          list.getEntries().forEach((entry) => {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          });
          
          if (cls > 0.1) { // CLS threshold
            logger.warn('High cumulative layout shift detected', {
              cls,
              operation: 'layout_shift_detection'
            });
          }
        });

        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          // Layout shift observer not supported
        }
      }
    }
  }

  /**
   * Optimize React Query settings for production
   */
  getOptimalQuerySettings() {
    return {
      defaultOptions: {
        queries: {
          // Longer stale time in production for better performance
          staleTime: import.meta.env.PROD ? 10 * 60 * 1000 : 5 * 60 * 1000,
          // Shorter gc time in production to manage memory
          gcTime: import.meta.env.PROD ? 5 * 60 * 1000 : 10 * 60 * 1000,
          // Reduce retries in production
          retry: import.meta.env.PROD ? 1 : 2,
          // Don't refetch on window focus in production
          refetchOnWindowFocus: import.meta.env.DEV,
          // Always refetch on reconnect
          refetchOnReconnect: true,
        },
        mutations: {
          retry: import.meta.env.PROD ? 0 : 1,
        },
      },
    };
  }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();