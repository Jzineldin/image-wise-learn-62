/**
 * StoryWizard Component
 * 4-step wizard for advanced story creation
 * Steps: Character → World → Plot → Visual Style
 */

import { useState } from "react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AIClient, InsufficientCreditsError } from "@/lib/api/ai-client";
import { FEATURES } from "@/lib/config/features";
import { normalizeAgeGroup, toDatabaseFormat } from "@/lib/utils/age-group";
const DEFAULT_AGE_GROUP = "7-9 years old" as const;

type Step = "Character" | "World" | "Plot" | "Visual";
const steps: Step[] = ["Character", "World", "Plot", "Visual"];

export default function StoryWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("Character");
  const [submitting, setSubmitting] = useState(false);

  // model
  const [character, setCharacter] = useState({
    name: "",
    type: "Child",
    trait: "Brave",
    companion: "",
  });
  const [world, setWorld] = useState({
    setting: "Forest",
    era: "Ancient",
    magic: 2,
  });
  const [plot, setPlot] = useState({
    goal: "Find treasure",
    challenge: "Journey",
    length: "Medium",
  });
  const [visual, setVisual] = useState({
    style: "Cinematic fantasy",
  });

  function next() {
    const i = steps.indexOf(step);
    if (i < steps.length - 1) setStep(steps[i + 1]);
  }
  function back() {
    const i = steps.indexOf(step);
    if (i > 0) setStep(steps[i - 1]);
  }

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

    setSubmitting(true);
    let createdStoryId: string | null = null;
    try {
      const dbAge = toDatabaseFormat(DEFAULT_AGE_GROUP);
      const shortAge = normalizeAgeGroup(DEFAULT_AGE_GROUP);
      const characterLine = `${character.type.toLowerCase()} named ${character.name || 'a hero'} who is ${character.trait.toLowerCase()}`;
      const storyPrompt = `Create a ${world.setting.toLowerCase()} ${plot.challenge.toLowerCase()} story where the goal is to ${plot.goal.toLowerCase()}. The main character is a ${characterLine}. The illustration style is ${visual.style}.`;

      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: `${character.name || 'Hero'}'s Adventure`,
          description: storyPrompt,
          prompt: storyPrompt,
          age_group: dbAge,
          genre: world.setting,
          language_code: 'en',
          original_language_code: 'en',
          status: 'generating',
          user_id: user.id,
          visibility: 'private',
          metadata: { wizard: { character, world, plot, visual } },
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
          theme: world.setting,
          character: character.name || 'a brave hero',
          traits: character.trait,
          prompt: storyPrompt,
          storyId: story.id,
          segmentNumber: 1,
        });
      } else {
        await AIClient.generateStory({
          prompt: storyPrompt,
          genre: world.setting,
          ageGroup: shortAge,
          storyId: story.id,
          languageCode: 'en',
          isInitialGeneration: true,
          characters: [{ name: character.name || 'Hero', type: character.type, traits: [character.trait] }],
        });
      }

      await supabase.from('stories').update({ status: 'active' }).eq('id', story.id);
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

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Step bar */}
      <div className="flex items-center justify-center gap-4">
        {steps.map((s, i) => {
          const active = s === step;
          const complete = steps.indexOf(step) > i;
          return (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  active
                    ? "bg-[rgba(242,181,68,0.15)] text-[#F4E3B2] ring-1 ring-[rgba(242,181,68,0.35)]"
                    : complete
                    ? "text-[#F4E3B2]"
                    : "text-[#C9C5D5]"
                }`}
              >
                {s}
              </div>
              {i < steps.length - 1 && (
                <span className="text-[#6f6a78]">•</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="h-px bg-[rgba(242,181,68,0.15)]" />

      {/* Panels */}
      {step === "Character" && (
        <div className="grid gap-4">
          <label>
            <span className="mb-2 block text-sm text-[#C9C5D5]">
              Main Character Name
            </span>
            <input
              value={character.name}
              onChange={(e) =>
                setCharacter({ ...character, name: e.target.value })
              }
              placeholder="e.g., Lily"
              className="w-full rounded-xl bg-[#0F0F14] px-4 py-3 text-white placeholder:text-[#6f6a78] outline-none ring-1 ring-[#26232c] focus:ring-[rgba(242,181,68,0.6)]"
              required
            />
          </label>

          <label>
            <span className="mb-2 block text-sm text-[#C9C5D5]">
              Character Species / Type
            </span>
            <select
              value={character.type}
              onChange={(e) =>
                setCharacter({ ...character, type: e.target.value })
              }
              className="w-full rounded-xl bg-[#0F0F14] px-4 py-3 text-white outline-none ring-1 ring-[#26232c] focus:ring-[rgba(242,181,68,0.6)]"
            >
              {["Child", "Elf", "Dog", "Dragon", "Robot"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>

          <div>
            <span className="mb-2 block text-sm text-[#C9C5D5]">
              Personality Trait
            </span>
            <div className="grid grid-cols-4 gap-3">
              {["Brave", "Curious", "Gentle", "Silly"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setCharacter({ ...character, trait: t })
                  }
                  className={`inline-flex items-center justify-center w-full min-h-[40px] rounded-xl bg-[#18181f] px-3 py-2.5 text-sm text-[#C9C5D5] border transition whitespace-nowrap hover:border-[rgba(242,181,68,0.25)] hover:text-[#F4E3B2] ${
                    character.trait === t
                      ? "border-[rgba(242,181,68,0.35)] text-[#F4E3B2]"
                      : "border-transparent"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <label>
            <span className="mb-2 block text-sm text-[#C9C5D5]">
              Optional Companion Character
            </span>
            <input
              value={character.companion}
              onChange={(e) =>
                setCharacter({ ...character, companion: e.target.value })
              }
              placeholder="e.g., a tiny glowing dragon"
              className="w-full rounded-xl bg-[#0F0F14] px-4 py-3 text-white placeholder:text-[#6f6a78] outline-none ring-1 ring-[#26232c] focus:ring-[rgba(242,181,68,0.6)]"
            />
          </label>
        </div>
      )}

      {step === "World" && (
        <div className="grid grid-cols-3 gap-4">
          <label className="col-span-1">
            <span className="mb-2 block text-sm text-[#C9C5D5]">Setting</span>
            <select
              value={world.setting}
              onChange={(e) =>
                setWorld({ ...world, setting: e.target.value })
              }
              className="w-full rounded-xl bg-[#0F0F14] px-4 py-3 text-white ring-1 ring-[#26232c] focus:ring-[rgba(242,181,68,0.6)]"
            >
              {["Forest", "Space", "Castle", "Ocean", "Desert"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>

          <label className="col-span-1">
            <span className="mb-2 block text-sm text-[#C9C5D5]">Era</span>
            <select
              value={world.era}
              onChange={(e) => setWorld({ ...world, era: e.target.value })}
              className="w-full rounded-xl bg-[#0F0F14] px-4 py-3 text-white ring-1 ring-[#26232c] focus:ring-[rgba(242,181,68,0.6)]"
            >
              {["Ancient", "Modern", "Futuristic"].map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </label>

          <label className="col-span-1">
            <span className="mb-2 block text-sm text-[#C9C5D5]">
              Magic Level
            </span>
            <input
              type="range"
              min={0}
              max={3}
              value={world.magic}
              onChange={(e) =>
                setWorld({ ...world, magic: Number(e.target.value) })
              }
              className="w-full accent-[#F2B544]"
            />
          </label>
        </div>
      )}

      {/* Plot Step */}
      {step === "Plot" && (
        <div className="grid grid-cols-3 gap-4">
          <label className="col-span-1">
            <span className="mb-2 block text-sm text-[#C9C5D5]">
              Story Goal
            </span>
            <select
              value={plot.goal}
              onChange={(e) => setPlot({ ...plot, goal: e.target.value })}
              className="w-full rounded-xl bg-[#0F0F14] px-4 py-3 text-white ring-1 ring-[#26232c] focus:ring-[rgba(242,181,68,0.6)]"
            >
              {["Find treasure", "Make a friend", "Save someone", "Learn something"].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>

          <label className="col-span-1">
            <span className="mb-2 block text-sm text-[#C9C5D5]">
              Challenge Type
            </span>
            <select
              value={plot.challenge}
              onChange={(e) =>
                setPlot({ ...plot, challenge: e.target.value })
              }
              className="w-full rounded-xl bg-[#0F0F14] px-4 py-3 text-white ring-1 ring-[#26232c] focus:ring-[rgba(242,181,68,0.6)]"
            >
              {["Journey", "Mystery", "Monster", "Puzzle"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="col-span-1">
            <span className="mb-2 block text-sm text-[#C9C5D5]">
              Story Length
            </span>
            <select
              value={plot.length}
              onChange={(e) => setPlot({ ...plot, length: e.target.value })}
              className="w-full rounded-xl bg-[#0F0F14] px-4 py-3 text-white ring-1 ring-[#26232c] focus:ring-[rgba(242,181,68,0.6)]"
            >
              {["Short", "Medium", "Long"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {step === "Visual" && (
        <div>
          <span className="mb-2 block text-sm text-[#C9C5D5]">
            Illustration Style
          </span>
          <div className="grid grid-cols-5 gap-3">
            {[
              "Watercolor",
              "Pixar-soft",
              "Storybook-sketch",
              "Anime-light",
              "Cinematic fantasy",
            ].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setVisual({ style: s })}
                className={`rounded-xl bg-[#18181f] px-3 py-10 text-sm text-[#C9C5D5] border transition ${
                  visual.style === s
                    ? "border-[rgba(242,181,68,0.35)] text-[#F4E3B2]"
                    : "border-transparent hover:border-[rgba(242,181,68,0.25)] hover:text-[#F4E3B2]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          disabled={step === "Character"}
          className="rounded-xl px-5 py-2 text-sm text-[#C9C5D5] hover:text-[#F4E3B2] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Back
        </button>

        {step !== "Visual" ? (
          <button
            type="button"
            onClick={next}
            className="rounded-xl bg-[rgba(242,181,68,0.15)] px-5 py-2 text-[#F4E3B2] ring-1 ring-[rgba(242,181,68,0.35)] hover:brightness-110"
          >
            Next →
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="mx-auto rounded-xl bg-[linear-gradient(180deg,#F2B544,#E6A73D,#B97F1F)] px-6 py-3 font-serif text-lg text-[#2b1900] shadow-[0_6px_18px_rgba(242,181,68,.28)] hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-[rgba(242,181,68,.5)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "⏳ Forging..." : "✨ Forge My Tale"}
          </button>
        )}
      </div>
    </form>
  );
}

