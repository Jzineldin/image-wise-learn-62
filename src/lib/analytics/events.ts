/**
 * Analytics Event Definitions
 *
 * Centralized event tracking for onboarding, gating, and conversion
 * Integrates with PostHog/Mixpanel via useAnalytics hook
 */

export type OnboardingStep = 'story_starter' | 'soft_auth' | 'first_chapter' | 'personalization';
export type GateTrigger = 'out_of_chapters' | 'out_of_credits' | 'video_gated' | 'tts_gated' | 'animate_gated' | 'settings';
export type FeatureType = 'tts' | 'animate' | 'video' | 'chapter';
export type GateReason = 'insufficient_credits' | 'daily_limit' | 'rate_limit';

// =============================================
// Onboarding Events
// =============================================

export interface OnboardingStepViewedEvent {
  event: 'onboarding_step_viewed';
  properties: {
    step: OnboardingStep;
    session_id: string;
    timestamp: string;
  };
}

export interface OnboardingStepCompletedEvent {
  event: 'onboarding_step_completed';
  properties: {
    step: OnboardingStep;
    time_spent_sec: number;
  };
}

export interface OnboardingCompletedEvent {
  event: 'onboarding_completed';
  properties: {
    signed_up: boolean;
    total_time_sec: number;
    first_chapter_id: string;
  };
}

export interface OnboardingAbandonedEvent {
  event: 'onboarding_abandoned';
  properties: {
    last_step: OnboardingStep;
    reason?: string;
  };
}

// =============================================
// Activation Events
// =============================================

export interface FirstChapterCreatedEvent {
  event: 'first_chapter_created';
  properties: {
    method: 'onboarding_prompt' | 'blank_editor';
    time_since_landing_sec: number;
  };
}

export interface FirstFeatureUsedEvent {
  event: 'first_feature_used';
  properties: {
    feature: FeatureType;
    credits_spent: number;
  };
}

export interface SecondStoryCreatedEvent {
  event: 'second_story_created';
  properties: {
    days_since_signup: number;
  };
}

// =============================================
// Generation Events
// =============================================

export interface ChapterGenerationRequestedEvent {
  event: 'chapter_generation_requested';
  properties: {
    story_id: string;
    type: 'text+image';
    chapters_remaining_today: number | null;
    is_subscriber: boolean;
  };
}

export interface ChapterGenerationSucceededEvent {
  event: 'chapter_generation_succeeded';
  properties: {
    chapter_id: string;
    generation_time_sec: number;
  };
}

export interface FeatureGenerationGatedEvent {
  event: 'feature_generation_gated';
  properties: {
    feature: FeatureType;
    reason: GateReason;
    credits_required: number;
    credits_available: number;
  };
}

// =============================================
// Conversion Events
// =============================================

export interface UpgradePromptShownEvent {
  event: 'upgrade_prompt_shown';
  properties: {
    trigger: GateTrigger;
    context: string;
  };
}

export interface UpgradePromptClickedEvent {
  event: 'upgrade_prompt_clicked';
  properties: {
    trigger: GateTrigger;
  };
}

export interface SubscriptionPurchasedEvent {
  event: 'subscription_purchased';
  properties: {
    plan: 'monthly' | 'annual';
    source: string;
    mrr: number;
  };
}

// =============================================
// Credits Events
// =============================================

export interface CreditsEarnedEvent {
  event: 'credits_earned';
  properties: {
    amount: number;
    source: 'signup_bonus' | 'daily_drip' | 'subscription_renew';
  };
}

export interface CreditsSpentEvent {
  event: 'credits_spent';
  properties: {
    amount: number;
    feature: FeatureType;
    job_id: string;
  };
}

export interface CreditsRefundedEvent {
  event: 'credits_refunded';
  properties: {
    amount: number;
    reason: 'generation_failed' | 'duplicate_charge';
  };
}

// =============================================
// Union Type for All Events
// =============================================

export type AnalyticsEvent =
  | OnboardingStepViewedEvent
  | OnboardingStepCompletedEvent
  | OnboardingCompletedEvent
  | OnboardingAbandonedEvent
  | FirstChapterCreatedEvent
  | FirstFeatureUsedEvent
  | SecondStoryCreatedEvent
  | ChapterGenerationRequestedEvent
  | ChapterGenerationSucceededEvent
  | FeatureGenerationGatedEvent
  | UpgradePromptShownEvent
  | UpgradePromptClickedEvent
  | SubscriptionPurchasedEvent
  | CreditsEarnedEvent
  | CreditsSpentEvent
  | CreditsRefundedEvent;

// =============================================
// Event Tracking Helpers
// =============================================

/**
 * Track an analytics event
 * Wraps useAnalytics().trackEvent() with type safety
 */
export const trackEvent = (event: AnalyticsEvent): void => {
  // This will be implemented via useAnalytics hook
  // For now, just log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event.event, event.properties);
  }

  // TODO: Integrate with PostHog/Mixpanel
  // if (window.posthog) {
  //   window.posthog.capture(event.event, event.properties);
  // }
};
