/**
 * QuickStartForm Component
 * Compact form for quick story creation (10-15 seconds)
 */

import { useState } from "react";
import { Sparkles, Leaf, Zap, Smile } from "lucide-react";
import type { ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AIClient, InsufficientCreditsError } from "@/lib/api/ai-client";
import { FEATURES } from "@/lib/config/features";
import { normalizeAgeGroup, toDatabaseFormat } from "@/lib/utils/age-group";
import { logger } from "@/lib/logger";
import { ChapterLimitReachedModal } from "@/components/modals/ChapterLimitReachedModal";


const GENRES = [
  "Fantasy",
  "Space Adventure",
  "Forest Fairytale",
  "Pirates",
  "Magical School",
  "Custom",
] as const;

const AGE_GROUPS_FULL = [
  "4-6 years old",
  "7-9 years old",
  "10-12 years old",
  "13+ years old",
] as const;

const TYPES = ["Child", "Animal", "Robot", "Elf", "Wizard", "Custom"] as const;

type Tone = "Whimsical" | "Cozy" | "Epic" | "Silly";

const toneIconMap: Record<Tone, ComponentType<{ className?: string }>> = {
  Whimsical: Sparkles,
  Cozy: Leaf,
  Epic: Zap,
  Silly: Smile,
};

export default function QuickStartForm() {
  const [hero, setHero] = useState("");
  const [type, setType] = useState<typeof TYPES[number]>("Child");
  const [genre, setGenre] = useState<typeof GENRES[number]>("Fantasy");
  const [tone, setTone] = useState<Tone>("Whimsical");
  const [submitting, setSubmitting] = useState(false);
  const [ageGroup, setAgeGroup] = useState<string>("7-9 years old");
  const [showChapterLimitModal, setShowChapterLimitModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();


  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create a story",
        variant: "destructive",
      });
      return;
    }

    // Pre-flight chapter limit check
    try {
      const { data: canGenerate, error: checkError } = await supabase.rpc('can_generate_chapter', {
        user_uuid: user.id
      });

      if (checkError) throw checkError;

      if (!canGenerate.allowed) {
        // Show chapter limit modal
        setShowChapterLimitModal(true);
        logger.info('Chapter creation gated', {
          userId: user.id,
          reason: canGenerate.reason,
          used: canGenerate.used,
          limit: canGenerate.limit,
          operation: 'chapter-creation-gated'
        });
        return; // Don't proceed with creation
      }
    } catch (error) {
      logger.error('Error checking chapter limit', error, { userId: user.id });
      // Continue anyway if check fails (graceful degradation)
    }

    setSubmitting(true);
    let createdStoryId: string | null = null;
    try {
      const dbAge = toDatabaseFormat(ageGroup);
      const shortAge = normalizeAgeGroup(ageGroup);
      const characterLine = type === "Child" ? (hero || "a child") : `a ${type.toLowerCase()} named ${hero || "a hero"}`;
      const storyPrompt = `Create a ${genre} story about ${characterLine}. The tone should be ${tone.toLowerCase()} and age-appropriate for ${dbAge}.`;

      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: `${hero || 'Hero'}'s Adventure`,
          description: storyPrompt,
          prompt: storyPrompt,
          age_group: dbAge,
          genre,
          language_code: 'en',
          original_language_code: 'en',
          status: 'generating',
          user_id: user.id,
          visibility: 'private',
          metadata: { hero, type, tone, ageGroup: dbAge },
        })
        .select()
        .single();

      if (storyError) throw storyError;
      if (!story) throw new Error('Failed to create story record');
      createdStoryId = story.id;

      if (FEATURES.USE_V2_GENERATION) {
        await AIClient.generateStoryPageV2({
          childName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Reader',
          ageGroup: dbAge as any,
          theme: genre,
          character: characterLine,
          traits: tone,
          prompt: storyPrompt,
          storyId: story.id,
          segmentNumber: 1,
        });
      } else {
        await AIClient.generateStory({
          prompt: storyPrompt,
          genre,
          ageGroup: shortAge,
          storyId: story.id,
          languageCode: 'en',
          isInitialGeneration: true,
          characters: [{ name: hero || 'Hero', type, traits: [tone] }],
        });
      }

      const { error: updateError } = await supabase.from('stories').update({ status: 'active' }).eq('id', story.id);
      if (updateError) {
        logger.error('Failed to update story status', { error: updateError, storyId: story.id });
      }
      logger.info('Story created successfully', {
        storyId: story.id,
        userId: user.id,
        status: 'active',
        navigatingTo: `/story/${story.id}`
      });
      navigate(`/story/${story.id}`);
    } catch (err: any) {
      if (err instanceof InsufficientCreditsError) {
        toast({
          title: 'Insufficient credits',
          description: `You need ${err.required} credits (${err.available} available).`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Generation failed',
          description: err?.message || 'Please try again.',
          variant: 'destructive',
        });
      }
      if (createdStoryId) {
        await supabase.from('stories').update({ status: 'failed' }).eq('id', createdStoryId);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const toneTileBase =
    "w-full rounded-xl bg-[#18181f] px-4 py-3 text-sm text-[#C9C5D5] border border-transparent transition hover:border-[rgba(242,181,68,.25)] hover:text-[#F4E3B2]";
  const toneTileSelected =
    "border-[rgba(242,181,68,.35)] text-[#F4E3B2] shadow-[inset_0_0_0_2px_rgba(242,181,68,.12)]";

  return (
    <form onSubmit={submit} className="space-y-5">


      <label className="block">
        <span className="mb-2 block text-sm text-[#C9C5D5]">Hero Name</span>
        <input
          value={hero}
          onChange={(e) => setHero(e.target.value)}
          placeholder="e.g., Lily"
          className="w-full rounded-xl bg-[#0F0F14] px-4 py-3 text-white placeholder:text-[#6f6a78] outline-none ring-1 ring-[#26232c] focus:ring-[rgba(242,181,68,0.6)]"
          required
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm text-[#C9C5D5]">
          Character Type
        </span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="w-full rounded-xl bg-[#0F0F14] px-4 py-3 text-white outline-none ring-1 ring-[#26232c] focus:ring-[rgba(242,181,68,0.6)]"
        >
          {TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm text-[#C9C5D5]">Genre</span>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value as any)}
          className="w-full rounded-xl bg-[#0F0F14] px-4 py-3 text-white outline-none ring-1 ring-[#26232c] focus:ring-[rgba(242,181,68,0.6)]"
        >
          {GENRES.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm text-[#C9C5D5]">Age Group</span>
        <select
          value={ageGroup}
          onChange={(e) => setAgeGroup(e.target.value)}
          className="w-full rounded-xl bg-[#0F0F14] px-4 py-3 text-white outline-none ring-1 ring-[#26232c] focus:ring-[rgba(242,181,68,0.6)]"
        >
          {AGE_GROUPS_FULL.map((ag) => (
            <option key={ag} value={ag}>{ag}</option>
          ))}
        </select>
      </label>


      <div>
        <span className="mb-2 block text-sm text-[#C9C5D5]">
          Choose a Tone
        </span>
        <div className="grid grid-cols-4 gap-3">
          {(["Whimsical", "Cozy", "Epic", "Silly"] as Tone[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTone(t)}
              className={`${toneTileBase} group flex flex-col items-center gap-2 py-4 ${
                tone === t ? toneTileSelected : ""
              }`}
              aria-pressed={tone === t}
            >
              {(() => { const Icon = toneIconMap[t]; return <Icon className={`w-5 h-5 ${tone === t ? 'text-[#F4E3B2]' : 'text-[#C9C5D5] group-hover:text-[#F4E3B2]'}`} /> })()}
              <span className="text-xs">{t}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        className="w-full rounded-xl bg-[linear-gradient(180deg,#F2B544,#E6A73D,#B97F1F)] px-6 py-3 font-serif text-lg text-[#2b1900] shadow-[0_6px_18px_rgba(242,181,68,.28)] hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-[rgba(242,181,68,.5)] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "⏳ Forging..." : "⚡ Forge My Tale"}
      </button>

      {/* Chapter Limit Modal */}
      <ChapterLimitReachedModal
        open={showChapterLimitModal}
        onClose={() => setShowChapterLimitModal(false)}
      />
    </form>
  );
}

