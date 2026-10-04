"use client";
import React from 'react';
import { ResolutionState } from '../lib/learner/resolution';

interface DashboardViewProps {
  onStartProblem: () => void;
  learnerResolutionState?: ResolutionState;
  streakCount?: number;
}

export default function DashboardView({
  onStartProblem,
  learnerResolutionState = "UNKNOWN",
  streakCount = 7
}: DashboardViewProps) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* LEFT SIDEBAR: Roadmap & Modules (col-span-12 lg:col-span-3) */}
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-5 border border-[#E5E5EA] shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E5EA]">
              <div>
                <h2 className="font-semibold text-sm text-[#1D1D1F] tracking-tight">Python Foundations</h2>
                <span className="text-[11px] text-[#86868B] font-medium">3 of 6 completed</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F5F5F7] text-[#86868B] border border-[#E5E5EA]">
                Track 01
              </span>
            </div>

            {/* Vertical Module Roadmap */}
            <div className="relative flex flex-col">
              {/* Module 1: Variables */}
              <div className="relative flex items-start gap-3 pb-5 group">
                <div className="absolute left-3.5 top-6 bottom-0 w-[1.5px] bg-[#34C759]/40"></div>
                <div className="w-7 h-7 rounded-full bg-[#EBF9EE] text-[#34C759] flex items-center justify-center shrink-0 z-10 border border-[#34C759]/20">
                  <span className="material-symbols-outlined text-[15px] font-bold">check</span>
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1D1D1F]">Variables</span>
                    <span className="text-[10px] font-semibold text-[#34C759]">Done</span>
                  </div>
                  <p className="text-[11px] text-[#86868B] truncate mt-0.5">Reference memory locations</p>
                </div>
              </div>

              {/* Module 2: Data Types */}
              <div className="relative flex items-start gap-3 pb-5 group">
                <div className="absolute left-3.5 top-6 bottom-0 w-[1.5px] bg-[#34C759]/40"></div>
                <div className="w-7 h-7 rounded-full bg-[#EBF9EE] text-[#34C759] flex items-center justify-center shrink-0 z-10 border border-[#34C759]/20">
                  <span className="material-symbols-outlined text-[15px] font-bold">check</span>
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1D1D1F]">Data Types</span>
                    <span className="text-[10px] font-semibold text-[#34C759]">Done</span>
                  </div>
                  <p className="text-[11px] text-[#86868B] truncate mt-0.5">Primitives &amp; truthiness</p>
                </div>
              </div>

              {/* Module 3: Lists & Indexing (ACTIVE CHECKPOINT) */}
              <div className="relative flex items-start gap-3 pb-5 group">
                <div className="absolute left-3.5 top-6 bottom-0 w-[1.5px] bg-[#E5E5EA]"></div>
                <div className="w-7 h-7 rounded-full bg-[#0071e3] text-white flex items-center justify-center shrink-0 z-10 shadow-xs ring-4 ring-[#0071e3]/10">
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </div>
                <div className="flex-1 min-w-0 bg-[#0071e3]/5 rounded-xl p-2.5 border border-[#0071e3]/20 -mt-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-[#0071e3]">Lists &amp; Indexing</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#0071e3] text-white uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-[#86868B]">0-based indexing &amp; M02 defense</p>
                </div>
              </div>

              {/* Module 4: Loops & Range (Locked) */}
              <div className="relative flex items-start gap-3 pb-5 group">
                <div className="absolute left-3.5 top-6 bottom-0 w-[1.5px] bg-[#E5E5EA]"></div>
                <div className="w-7 h-7 rounded-full bg-[#F5F5F7] text-[#A1A1A6] flex items-center justify-center shrink-0 z-10 border border-[#E5E5EA]">
                  <span className="material-symbols-outlined text-[13px]">lock</span>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#86868B]">Loops &amp; Range</span>
                    <span className="text-[10px] text-[#A1A1A6]">Locked</span>
                  </div>
                </div>
              </div>

              {/* Module 5: Slicing Subsets (Locked) */}
              <div className="relative flex items-start gap-3 pb-5 group">
                <div className="absolute left-3.5 top-6 bottom-0 w-[1.5px] bg-[#E5E5EA]"></div>
                <div className="w-7 h-7 rounded-full bg-[#F5F5F7] text-[#A1A1A6] flex items-center justify-center shrink-0 z-10 border border-[#E5E5EA]">
                  <span className="material-symbols-outlined text-[13px]">lock</span>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#86868B]">Slicing Subsets</span>
                    <span className="text-[10px] text-[#A1A1A6]">Locked</span>
                  </div>
                </div>
              </div>

              {/* Module 6: Functions & Scope (Locked) */}
              <div className="relative flex items-start gap-3 group">
                <div className="w-7 h-7 rounded-full bg-[#F5F5F7] text-[#A1A1A6] flex items-center justify-center shrink-0 z-10 border border-[#E5E5EA]">
                  <span className="material-symbols-outlined text-[13px]">lock</span>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#86868B]">Functions &amp; Scope</span>
                    <span className="text-[10px] text-[#A1A1A6]">Locked</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER MAIN COLUMN: Active Challenge & Cognitive Models (col-span-12 lg:col-span-6) */}
        <section className="col-span-12 lg:col-span-6 flex flex-col gap-6">
          {/* Active Challenge Hero Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5EA] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#0071e3] uppercase tracking-wider bg-[#d7e2ff] px-2.5 py-1 rounded-full">
                Active Assessment
              </span>
              <span className="text-xs text-[#86868B]">Problem 02 of 24</span>
            </div>

            <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight mb-2">
              The First Element (0-Based Indexing)
            </h2>
            <p className="text-sm text-[#86868B] leading-relaxed mb-6">
              Access the very first element of a non-empty Python list. This problem tests whether your conceptual model assumes 1-based or 0-based indexing.
            </p>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#0071e3] font-mono text-xs font-bold border border-[#E5E5EA]">
                  [0]
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1D1D1F] block">Target Misconception: M02</span>
                  <span className="text-[11px] text-[#86868B]">"The first list index is 1"</span>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                learnerResolutionState === 'VERIFIED_RESOLVED'
                  ? 'bg-[#EBF9EE] text-[#34C759]'
                  : learnerResolutionState === 'IMPROVING'
                  ? 'bg-[#FEF7E8] text-[#F5A623]'
                  : 'bg-[#d7e2ff] text-[#0071e3]'
              }`}>
                {learnerResolutionState === 'VERIFIED_RESOLVED' ? 'Mastered' : 'Ready'}
              </span>
            </div>

            <button
              onClick={onStartProblem}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#1D1D1F] hover:bg-black text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span>{learnerResolutionState === 'VERIFIED_RESOLVED' ? 'Review Solution' : 'Solve In Workspace'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          {/* Cognitive Model Status Cards */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E5EA] shadow-2xs">
            <h3 className="font-bold text-base text-[#1D1D1F] mb-4">Learner Cognitive Model</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]">
                <div>
                  <span className="text-xs font-bold text-[#1D1D1F] block">0-Based List Indexing</span>
                  <span className="text-[11px] text-[#86868B]">Understands items[0] references initial item</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  learnerResolutionState === 'VERIFIED_RESOLVED'
                    ? 'bg-[#EBF9EE] text-[#34C759]'
                    : 'bg-[#FEF7E8] text-[#F5A623]'
                }`}>
                  {learnerResolutionState === 'VERIFIED_RESOLVED' ? 'Verified' : 'Evaluating'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]">
                <div>
                  <span className="text-xs font-bold text-[#1D1D1F] block">Variable Reference Model</span>
                  <span className="text-[11px] text-[#86868B]">Understands name-to-object pointers</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBF9EE] text-[#34C759]">
                  Verified
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]">
                <div>
                  <span className="text-xs font-bold text-[#1D1D1F] block">Slice Endpoint Model</span>
                  <span className="text-[11px] text-[#86868B]">Distinguishes inclusive start vs exclusive stop</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#edeef0] text-[#86868B]">
                  Upcoming
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT CONTEXT RAIL: Stats & Streak (col-span-12 lg:col-span-3) */}
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          {/* Daily Streak Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#E5E5EA] shadow-2xs">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🔥</span>
              <div>
                <span className="text-xs font-bold text-[#1D1D1F] block">{streakCount} Day Streak</span>
                <span className="text-[11px] text-[#86868B]">Consistent daily learning</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 pt-2 border-t border-[#E5E5EA]">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-[#86868B]">{day}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    idx < 5 ? 'bg-[#0071e3] text-white' : 'bg-[#edeef0] text-[#A1A1A6]'
                  }`}>
                    {idx < 5 ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Health / Accuracy Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#E5E5EA] shadow-2xs space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#34C759] bg-[#EBF9EE] px-2 py-0.5 rounded">
              Engine Performance
            </span>
            <h4 className="font-bold text-sm text-[#1D1D1F]">Misconception Model</h4>
            <div className="space-y-1.5 text-xs text-[#5f5e60]">
              <div className="flex justify-between">
                <span>Model:</span>
                <span className="font-mono font-bold text-[#1D1D1F]">Naive Bayes v1</span>
              </div>
              <div className="flex justify-between">
                <span>Held-Out Accuracy:</span>
                <span className="font-bold text-[#34C759]">100.00%</span>
              </div>
              <div className="flex justify-between">
                <span>Macro-F1:</span>
                <span className="font-bold text-[#34C759]">1.0000</span>
              </div>
              <div className="flex justify-between">
                <span>Abstention Guard:</span>
                <span className="font-bold text-[#0071e3]">Active</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
