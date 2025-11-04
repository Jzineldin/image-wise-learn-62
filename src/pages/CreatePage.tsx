/**
 * CreatePage Component
 * New cinematic UI for story creation with Quick Start and Story Wizard tabs
 */

import { useState } from "react";
import HeroBackground from "@/components/HeroBackground";
import QuickStartForm from "@/components/QuickStartForm";
import StoryWizard from "@/components/StoryWizard";

export default function CreatePage() {


  const [tab, setTab] = useState<"quick" | "wizard">("quick");



  return (
    <div className="relative min-h-screen text-white">
      <HeroBackground />
      <main className="relative z-10 mx-auto max-w-xl px-4 py-16">
        <div className="rounded-3xl bg-[rgba(17,17,22,.85)] backdrop-blur-md ring-1 ring-[rgba(242,181,68,.18)] shadow-[0_12px_48px_rgba(0,0,0,.45)]">
          <header className="px-5 pt-6 md:px-8 md:pt-8 text-center">
            <h1 className="font-serif text-3xl md:text-4xl text-[#F4E3B2] tracking-wide">
              Let's Begin Your Tale!
            </h1>
            <nav className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setTab("quick")}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  tab === "quick"
                    ? "bg-[rgba(242,181,68,.15)] text-[#F4E3B2] ring-1 ring-[rgba(242,181,68,.35)]"
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
                    ? "bg-[rgba(242,181,68,.15)] text-[#F4E3B2] ring-1 ring-[rgba(242,181,68,.35)]"
                    : "text-[#C9C5D5] hover:text-[#F4E3B2]"
                }`}
              >
                Story Wizard
              </button>
            </nav>
            {tab === "quick" && (
              <p className="mt-1 text-sm text-[#C9C5D5]">Create a Story Instantly</p>
            )}
          </header>

          <div className="mx-5 md:mx-8 mt-4 h-px bg-[rgba(242,181,68,.15)]" />

          <section className="px-5 py-6 md:px-8 md:py-8">
            {tab === "quick" ? <QuickStartForm /> : <StoryWizard />}
          </section>
        </div>
      </main>
    </div>
  );
}

