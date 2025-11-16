/**
 * Story-related type definitions
 */

import { Json } from '@/integrations/supabase/types';

// Status types for story lifecycle
export type VoiceStatus = 'none' | 'queued' | 'processing' | 'ready' | 'failed';
export type AnimationStatus = 'none' | 'queued' | 'processing' | 'ready' | 'failed';
export type ChapterReadiness = 'complete' | 'incomplete';

// Type guard for JSON-to-object conversions
export function parseJsonResponse<T>(json: Json | null | undefined, fallback: T): T {
  if (!json) return fallback;
  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    return json as T;
  }
  return fallback;
}

// Helper to convert database response to typed object
export function toTypedResponse<T>(data: Json | null): T | null {
  if (!data) return null;
  return data as T;
}

// Readiness summary type
export interface ReadinessSummary {
  total_chapters: number;
  ready_chapters: number;
  is_fully_ready: boolean;
  missing_voice?: number;
  missing_animation?: number;
}

// Chapter type for story viewer
export interface Chapter {
  id: string;
  story_id: string;
  segment_number: number;
  chapter_title: string;
  content: string;
  image_url: string | null;
  chapter_cover_url: string | null;
  audio_url: string | null;
  video_url: string | null;
  voice_status: VoiceStatus;
  animation_status: AnimationStatus;
  voice_error: string | null;
  animation_error: string | null;
  animation_config: Json | null;
  chapter_age_range: string | null;
  chapter_tags: string[];
  audio_generation_status: string | null;
  video_generation_status: string | null;
  created_at: string;
  updated_at: string;
}

// Status badge configuration
export const VOICE_STATUS_CONFIG: Record<VoiceStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  none: { label: 'No Voice', variant: 'secondary', icon: null },
  queued: { label: 'Queued', variant: 'secondary', icon: null },
  processing: { label: 'Processing', variant: 'default', icon: null },
  ready: { label: 'Ready', variant: 'default', icon: null },
  failed: { label: 'Failed', variant: 'destructive', icon: null },
};

export const ANIMATION_STATUS_CONFIG: Record<AnimationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  none: { label: 'No Animation', variant: 'secondary', icon: null },
  queued: { label: 'Queued', variant: 'secondary', icon: null },
  processing: { label: 'Processing', variant: 'default', icon: null },
  ready: { label: 'Ready', variant: 'default', icon: null },
  failed: { label: 'Failed', variant: 'destructive', icon: null },
};

export const CHAPTER_READINESS_CONFIG: Record<ChapterReadiness, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  complete: { label: 'Complete', variant: 'default', icon: null },
  incomplete: { label: 'Incomplete', variant: 'secondary', icon: null },
};
