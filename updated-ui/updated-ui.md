Design tokens (Tailwind-friendly)

Palette

bg-deep: #0B0C12

bg-card: rgba(17,17,22,0.85) (fallback #111116)

text-primary: #F4E3B2

text-muted: #C9C5D5

gold: #F2B544

gold-600: #DA9C2E

gold-700: #B97F1F

stroke-gold: rgba(242, 181, 68, 0.35)

focus-gold: rgba(242, 181, 68, 0.6)

Effects

Card radius: rounded-3xl

Input radius: rounded-xl

Shadow card: shadow-[0_10px_40px_rgba(0,0,0,0.45)]

Glow ring: ring-2 ring-[rgba(242,181,68,0.35)]

Button gradient: from-[#F2B544] via-[#E6A73D] to-[#B97F1F]

Typography

Display: Cinzel or DM Serif Display

UI: Inter or Manrope

Title tracking: tracking-wide

Gold title: text-[#F4E3B2] drop-shadow

Tailwind config additions
// tailwind.config.ts
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        deep: "#0B0C12",
        card: "rgba(17,17,22,0.85)",
        gold: {
          DEFAULT: "#F2B544",
          600: "#DA9C2E",
          700: "#B97F1F",
        },
      },
      boxShadow: {
        card: "0 10px 40px rgba(0,0,0,.45)",
      },
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(180deg,#F2B544 0%,#E6A73D 50%,#B97F1F 100%)",
        "cosmic":
          "radial-gradient(1200px 700px at 20% -10%, rgba(104,89,210,.25), transparent 60%), radial-gradient(1000px 600px at 90% 10%, rgba(247,180,76,.10), transparent 50%), linear-gradient(180deg,#0B0C12 0%, #0B0C12 100%)",
      },
    },
  },
  plugins: [],
};

Add the fonts in your HTML head (Google Fonts: Cinzel + Inter).

Page structure

CreatePage
 ├─ HeroBackground (stars/fog)
 └─ CardTabs
    ├─ QuickStartForm
    └─ StoryWizard (steps: Character → World → Plot → Visual Style)

Hero background (cinematic fog + stars)
// src/components/HeroBackground.tsx
export default function HeroBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 bg-cosmic"
    >
      {/* star specks */}
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-screen">
        <svg className="w-full h-full">
          {[...Array(120)].map((_, i) => (
            <circle
              key={i}
              cx={Math.random() * 1600}
              cy={Math.random() * 1200}
              r={Math.random() * 1.2 + 0.2}
              fill="#F2B544"
              opacity={Math.random() * 0.7}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

Tabs container

// src/pages/CreatePage.tsx
import { useState } from "react";
import HeroBackground from "@/components/HeroBackground";
import QuickStartForm from "@/components/QuickStartForm";
import StoryWizard from "@/components/StoryWizard";

export default function CreatePage() {
  const [tab, setTab] = useState<"quick" | "wizard">("quick");

  return (
    <div className="min-h-screen bg-deep text-white">
      <HeroBackground />
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-3xl bg-card shadow-card backdrop-blur-md ring-1 ring-[rgba(242,181,68,0.15)]">
          <header className="px-8 pt-8 text-center">
            <h1 className="font-serif text-3xl text-[#F4E3B2] tracking-wide">
              Let’s Begin Your Tale!
            </h1>
            <nav className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setTab("quick")}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  tab === "quick"
                    ? "bg-[rgba(242,181,68,0.15)] text-[#F4E3B2] ring-1 ring-[rgba(242,181,68,0.35)]"
                    : "text-[#C9C5D5] hover:text-[#F4E3B2]"
                }`}
              >
                Quick Start
              </button>
              <span className="text-[#6f6a78]">•</span>
              <button
                onClick={() => setTab("wizard")}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  tab === "wizard"
                    ? "bg-[rgba(242,181,68,0.15)] text-[#F4E3B2] ring-1 ring-[rgba(242,181,68,0.35)]"
                    : "text-[#C9C5D5] hover:text-[#F4E3B2]"
                }`}
              >
                Story Wizard
              </button>
            </nav>
          </header>

          <section className="px-8 pb-8 pt-6">
            {tab === "quick" ? <QuickStartForm /> : <StoryWizard />}
          </section>
        </div>
      </main>
    </div>
  );
}


Quick Start (compact)

// src/components/QuickStartForm.tsx
import { useState } from "react";

const GENRES = [
  "Fantasy",
  "Space Adventure",
  "Forest Fairytale",
  "Pirates",
  "Magical School",
  "Custom",
] as const;

const TYPES = ["Child", "Animal", "Robot", "Elf", "Wizard", "Custom"] as const;

type Tone = "Whimsical" | "Cozy" | "Epic" | "Silly";

export default function QuickStartForm() {
  const [hero, setHero] = useState("");
  const [type, setType] = useState<typeof TYPES[number]>("Child");
  const [genre, setGenre] = useState<typeof GENRES[number]>("Fantasy");
  const [tone, setTone] = useState<Tone>("Whimsical");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // send to backend
    const payload = { hero, type, genre, tone };
    console.log("QUICK_START_PAYLOAD", payload);
    // TODO: call your API
  }

  const toneBtn =
    "w-full rounded-xl border border-transparent bg-[#18181f] px-4 py-3 text-sm text-[#C9C5D5] hover:border-[rgba(242,181,68,0.25)] hover:text-[#F4E3B2] transition";

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

      <div className="grid grid-cols-2 gap-4">
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
      </div>

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
              className={`${toneBtn} ${
                tone === t
                  ? "border-[rgba(242,181,68,0.35)] text-[#F4E3B2] shadow-[0_0_0_2px_rgba(242,181,68,0.12)_inset]"
                  : ""
              }`}
              aria-pressed={tone === t}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-gold-gradient px-6 py-3 font-serif text-lg text-[#2b1900] shadow-[0_6px_18px_rgba(242,181,68,.25)] hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-[rgba(242,181,68,0.5)]"
      >
        ⚡ Forge My Tale
      </button>
    </form>
  );
}


Story Wizard (horizontal step bar, compact)


// src/components/StoryWizard.tsx
import { useState } from "react";

type Step = "Character" | "World" | "Plot" | "Visual";
const steps: Step[] = ["Character", "World", "Plot", "Visual"];

export default function StoryWizard() {
  const [step, setStep] = useState<Step>("Character");

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

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { character, world, plot, visual };
    console.log("STORY_WIZARD_PAYLOAD", payload);
    // TODO: call your API
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

          <div className="grid grid-cols-2 gap-4">
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

            <label>
              <span className="mb-2 block text-sm text-[#C9C5D5]">
                Personality Trait
              </span>
              <div className="grid grid-cols-4 gap-2">
                {["Brave", "Curious", "Gentle", "Silly"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setCharacter({ ...character, trait: t })
                    }
                    className={`rounded-xl bg-[#18181f] px-3 py-2 text-sm text-[#C9C5D5] hover:border-[rgba(242,181,68,0.25)] hover:text-[#F4E3B2] border ${
                      character.trait === t
                        ? "border-[rgba(242,181,68,0.35)] text-[#F4E3B2]"
                        : "border-transparent"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </label>
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
          className="rounded-xl px-4 py-2 text-sm text-[#C9C5D5] hover:text-[#F4E3B2] disabled:opacity-40"
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
            className="rounded-xl bg-gold-gradient px-6 py-3 font-serif text-lg text-[#2b1900] shadow-[0_6px_18px_rgba(242,181,68,.25)] hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-[rgba(242,181,68,0.5)]"
          >
            ✨ Forge My Tale
          </button>
        )}
      </div>
    </form>
  );
}


Accessibility & UX notes

All interactive elements have clear focus rings in gold.

Buttons use aria-pressed where appropriate (tone/style).

Keep everything within one card; no vertical scroll at desktop max-width max-w-xl.

Mobile: switch grids to grid-cols-2 or grid-cols-1 with sm: breakpoints.