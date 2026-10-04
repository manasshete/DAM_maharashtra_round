"use client";
import React from 'react';

export type NavTab = 'landing' | 'learn' | 'problems' | 'workspace' | 'progress';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  streakCount?: number;
  showJudgeDrawer: boolean;
  onToggleJudgeDrawer: () => void;
  solvedCount?: number;
}

export default function Navbar({
  activeTab,
  onSelectTab,
  streakCount = 7,
  showJudgeDrawer,
  onToggleJudgeDrawer,
  solvedCount = 4
}: NavbarProps) {
  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-[#FBFBFD]/85 backdrop-blur-xl border-b border-[#E5E5EA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <button 
            onClick={() => onSelectTab('landing')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0071e3] text-white flex items-center justify-center font-bold text-base shadow-sm">
              R:
            </div>
            <span className="font-semibold text-lg text-[#1D1D1F] tracking-tight group-hover:text-[#0071e3] transition-colors">
              Re:Learn
            </span>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#edeef0]/60 p-1 rounded-full border border-[#E5E5EA]">
            <button
              onClick={() => onSelectTab('learn')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 ${
                activeTab === 'learn'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              Learn
            </button>
            <button
              onClick={() => onSelectTab('problems')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 ${
                activeTab === 'problems'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              Problems
            </button>
            <button
              onClick={() => onSelectTab('workspace')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 flex items-center gap-1.5 ${
                activeTab === 'workspace'
                  ? 'bg-white text-[#0071e3] shadow-xs'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-pulse"></span>
              Workspace
            </button>
            <button
              onClick={() => onSelectTab('landing')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 ${
                activeTab === 'landing'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              Pedagogy
            </button>
          </nav>
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-3">
          {/* Judge Telemetry Toggle */}
          <button
            onClick={onToggleJudgeDrawer}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              showJudgeDrawer
                ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-xs'
                : 'bg-white text-[#86868B] border-[#E5E5EA] hover:border-[#D1D1D6] hover:text-[#1D1D1F]'
            }`}
            title="Inspect Live Machine Learning Diagnosis & Differential Evidence"
          >
            <span className="material-symbols-outlined text-[15px]">analytics</span>
            <span>Judge Trace</span>
          </button>

          {/* Streak Indicator */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E5E5EA] shadow-2xs">
            <span className="text-sm select-none">🔥</span>
            <span className="font-mono text-xs font-bold text-[#1D1D1F]">{streakCount}</span>
          </div>

          {/* Quick Problem Launcher */}
          <button
            onClick={() => onSelectTab('workspace')}
            className="hidden lg:inline-flex items-center justify-center rounded-full px-4 py-1.5 bg-[#1D1D1F] text-white text-xs font-semibold hover:bg-black transition-all shadow-xs"
          >
            Resume Challenge
          </button>

          {/* User Profile Badge */}
          <div className="w-8 h-8 rounded-full bg-[#0071e3] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            J
          </div>
        </div>
      </div>
    </header>
  );
}
