/**
 * Query and pagination constants
 */

export const QUERY_LIMITS = {
  discover: 20,
  adminStories: 50,
  adminUsers: 10,
  adminCompletedStories: 50,
  auditLogs: 1000,
  audioCharges: 1000,
  featuredStories: 20,
} as const;

export const PAGINATION = {
  pageSize: 20,
  maxPages: 100,
  infiniteScrollThreshold: 0.8, // Trigger load more at 80% scroll
} as const;

export const ANIMATION_DELAYS = {
  autoPlayResume: 1000,
  transition: 150,
  slideChange: 5000,
  carouselInterval: 5000,
} as const;

export const STALE_TIMES = {
  // React Query stale times in milliseconds
  short: 1 * 60 * 1000,      // 1 minute
  medium: 5 * 60 * 1000,     // 5 minutes
  long: 10 * 60 * 1000,      // 10 minutes
  veryLong: 30 * 60 * 1000,  // 30 minutes
} as const;

export const CACHE_TIMES = {
  // React Query garbage collection times in milliseconds
  short: 5 * 60 * 1000,      // 5 minutes
  medium: 10 * 60 * 1000,    // 10 minutes
  long: 30 * 60 * 1000,      // 30 minutes
  veryLong: 60 * 60 * 1000,  // 1 hour
} as const;

