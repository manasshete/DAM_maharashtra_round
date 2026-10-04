"use client";
import React from 'react';

interface LandingViewProps {
  onStartLearning: () => void;
  onExploreProblems: () => void;
}

export default function LandingView({ onStartLearning, onExploreProblems }: LandingViewProps) {
  return (
    <div className="w-full bg-[#FBFBFD]">
      {/* SECTION 1: HERO */}
      <section className="w-full max-w-[1120px] mx-auto px-4 sm:px-6 pt-12 md:pt-20 pb-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-6 flex flex-col items-start pr-0 lg:pr-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-4">
              <span className="w-2 h-2 rounded-full bg-[#0071e3] animate-pulse"></span>
              Misconception-Aware Tutor
            </span>

            <div className="w-full my-3 py-3 border-t border-b border-[#E5E5EA]">
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold text-[#1D1D1F] tracking-tight leading-[1.08]">
                Learn to think<br className="hidden sm:inline" /> in code.
              </h1>
            </div>

            <p className="text-base sm:text-lg text-[#86868B] leading-relaxed my-4">
              Don't just fix errors through trial and error. Re:Learn pinpoints your underlying mental models, diagnoses misconceptions, and ensures genuine comprehension.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onStartLearning}
                className="inline-flex items-center justify-center rounded-full px-7 py-3.5 bg-[#1D1D1F] text-white hover:bg-black font-semibold text-sm transition-all duration-150 shadow-sm active:scale-[0.98]"
              >
                Start learning
              </button>
              <button
                onClick={onExploreProblems}
                className="inline-flex items-center justify-center rounded-full px-6 py-3.5 bg-white border border-[#E5E5EA] text-[#1D1D1F] hover:bg-[#F5F5F7] font-semibold text-sm transition-all duration-150 shadow-xs"
              >
                <span>Browse catalog</span>
                <span className="material-symbols-outlined text-[18px] ml-1.5 text-[#86868B]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Right Column: 4-Step Pedagogical Model */}
          <div className="lg:col-span-6 w-full relative">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#E5E5EA] flex flex-col items-center justify-center max-w-md mx-auto w-full">
              <div className="w-full flex flex-col items-center">
                {/* Step 1: Solve */}
                <div className="w-full flex items-center justify-between p-3.5 px-5 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#34C759] shadow-2xs">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[#1D1D1F] block">1. Solve</span>
                      <span className="text-xs text-[#86868B]">Write or choose code</span>
                    </div>
                  </div>
                </div>

                {/* Connector */}
                <div className="flex flex-col items-center py-1">
                  <div className="w-0.5 h-5 bg-[#D1D1D6]"></div>
                  <span className="material-symbols-outlined text-[#A1A1A6] text-[16px] -mt-1">arrow_downward</span>
                </div>

                {/* Step 2: Apply */}
                <div className="w-full flex items-center justify-between p-3.5 px-5 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#34C759] shadow-2xs">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[#1D1D1F] block">2. Execute</span>
                      <span className="text-xs text-[#86868B]">Observe Pyodide runtime behavior</span>
                    </div>
                  </div>
                </div>

                {/* Connector */}
                <div className="flex flex-col items-center py-1">
                  <div className="w-0.5 h-5 bg-[#0071e3]"></div>
                  <span className="material-symbols-outlined text-[#0071e3] text-[16px] -mt-1">arrow_downward</span>
                </div>

                {/* Step 3: Explain (ACTIVE STEP) */}
                <div className="w-full flex items-center justify-between p-4 px-5 rounded-2xl bg-[#0071e3] text-white shadow-lg ring-4 ring-[#0071e3]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[20px]">psychology</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white block">3. Explain</span>
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] uppercase tracking-wider text-white font-bold">
                          The Core Difference
                        </span>
                      </div>
                      <span className="text-xs text-white/80">Articulate the underlying mental model</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-white text-[20px]">verified</span>
                </div>

                {/* Connector */}
                <div className="flex flex-col items-center py-1">
                  <div className="w-0.5 h-5 bg-[#D1D1D6]"></div>
                  <span className="material-symbols-outlined text-[#A1A1A6] text-[16px] -mt-1">arrow_downward</span>
                </div>

                {/* Step 4: Master */}
                <div className="w-full flex items-center justify-between p-3.5 px-5 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#A1A1A6] shadow-2xs">
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[#1D1D1F] block">4. Verified Mastery</span>
                      <span className="text-xs text-[#86868B]">Pass transfer &amp; reasoning checks</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: PROBLEM VS SOLUTION (THE RE:LEARN CONTRAST) */}
      <section className="w-full max-w-[1120px] mx-auto px-4 sm:px-6 pt-8 pb-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#0071e3] uppercase tracking-wider">The Paradigm Shift</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] tracking-tight mt-1 mb-3">
            Wrong answer is only the beginning.
          </h2>
          <p className="text-sm text-[#86868B]">
            Conventional test suites tell you what failed. Re:Learn diagnoses why your reasoning deviated.
          </p>
        </div>

        {/* Comparative Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traditional Card */}
          <div className="bg-[#F5F5F7] rounded-3xl p-8 flex flex-col justify-between border border-[#E5E5EA] shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold text-[#A1A1A6] uppercase tracking-wider">Traditional Platforms</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFECEB] text-[#FF3B30] text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  Wrong Answer
                </span>
              </div>
              <div className="bg-[#edeef0] rounded-xl p-4 font-mono text-xs text-[#1D1D1F] mb-6 space-y-1">
                <div className="text-[#86868B]"># Test case #2 failed</div>
                <div className="text-[#FF3B30]">Expected: "apple"</div>
                <div className="text-[#FF3B30]">Your output: "banana"</div>
              </div>
              <div className="space-y-2 mb-6">
                <h4 className="text-base font-semibold text-[#1D1D1F]">Syntax Barrier &amp; Blind Guessing</h4>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  Provides raw test-case diffs without diagnostic probing. Learners repeatedly guess index changes until arbitrary tests pass, leaving conceptual bugs unaddressed.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-[#E5E5EA] flex items-center justify-between text-xs text-[#86868B]">
              <span>System outcome</span>
              <span className="font-semibold text-[#FF3B30]">"Try again."</span>
            </div>
          </div>

          {/* Re:Learn Card */}
          <div className="bg-white rounded-3xl p-8 flex flex-col justify-between shadow-xl ring-2 ring-[#0071e3]/20 border border-[#0071e3]/30">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold text-[#0071e3] uppercase tracking-wider">Re:Learn Approach</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d7e2ff] text-[#0071e3] text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  Diagnostic Probing
                </span>
              </div>
              <div className="bg-[#FBFBFD] rounded-xl p-4 border border-[#E5E5EA] mb-6 space-y-2">
                <div className="text-xs font-bold text-[#0071e3] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                  Let's figure out what happened.
                </div>
                <p className="text-xs text-[#1D1D1F] leading-relaxed">
                  Your code printed the second element instead of the first. In Python, list indexing begins at index <span className="font-mono font-bold bg-[#edeef0] px-1 rounded">0</span>, not 1.
                </p>
              </div>
              <div className="space-y-2 mb-6">
                <h4 className="text-base font-semibold text-[#1D1D1F]">Correct-Answer Trap Detection</h4>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  Even if output matches coincidentally, Re:Learn verifies your conceptual reasoning before marking a topic resolved.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-[#E5E5EA] flex items-center justify-between">
              <span className="text-xs text-[#86868B]">Guided resolution</span>
              <button
                onClick={onStartLearning}
                className="text-xs text-[#0071e3] font-bold hover:underline inline-flex items-center gap-1"
              >
                Understand why <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FINAL CTA */}
      <section className="w-full max-w-[1120px] mx-auto px-4 sm:px-6 text-center py-16">
        <div className="max-w-xl mx-auto flex flex-col items-center">
          <span className="text-xs font-bold tracking-widest text-[#86868B] uppercase mb-2">
            Get Started Now
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1F] tracking-tight mb-4">
            Ready to understand your code?
          </h2>
          <p className="text-sm text-[#86868B] leading-relaxed mb-6">
            Experience misconception-aware programming education designed for unshakeable foundations.
          </p>
          <button
            onClick={onStartLearning}
            className="inline-flex items-center justify-center rounded-full px-8 py-3.5 bg-[#1D1D1F] text-white hover:bg-black font-semibold text-sm transition-all duration-150 shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            Start with Problem 02 (The First Element)
          </button>
          <p className="text-xs text-[#A1A1A6] mt-4">
            Deterministic Evaluation · Naive Bayes Misconception Model · In-Browser Pyodide Sandbox
          </p>
        </div>
      </section>
    </div>
  );
}
