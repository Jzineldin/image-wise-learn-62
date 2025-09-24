/**
 * Performance tracking hook for React Query and UI interactions
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { performanceOptimizer } from '@/lib/performance-optimization';
import { performanceMonitor } from '@/lib/performance-monitor';

export function usePerformanceTracker() {
  const queryClient = useQueryClient();

  // Track React Query cache performance
  const trackQueryPerformance = useCallback((queryKey: string, isHit: boolean) => {
    if (isHit) {
      performanceOptimizer.trackCacheHit();
    } else {
      performanceOptimizer.trackCacheMiss();
    }
    
    performanceMonitor.trackCacheHit(queryKey, isHit);
  }, []);

  // Track query execution time
  const trackQueryExecution = useCallback((queryKey: string) => {
    const startTime = performance.now();
    
    return {
      finish: (success: boolean = true) => {
        const endTime = performance.now();
        performanceMonitor.trackAPICall(queryKey, startTime, success, {
          operation: 'react_query_execution',
          queryKey,
          cacheSize: queryClient.getQueryCache().getAll().length
        });
      }
    };
  }, [queryClient]);

  // Track component render performance
  const trackComponentRender = useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return {
      finish: () => {
        performanceMonitor.trackUserAction(`render_${componentName}`, startTime, {
          operation: 'component_render',
          component: componentName
        });
      }
    };
  }, []);

  return {
    trackQueryPerformance,
    trackQueryExecution,
    trackComponentRender,
    trackPageLoad: performanceMonitor.trackPageLoad.bind(performanceMonitor),
    getMemoryUsage: performanceMonitor.getMemoryUsage.bind(performanceMonitor),
  };
}