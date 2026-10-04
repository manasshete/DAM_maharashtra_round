"use client";
import React, { useState } from 'react';
import Navbar, { NavTab } from './Navbar';
import LandingView from './LandingView';
import DashboardView from './DashboardView';
import ProblemsView, { ProblemItem, PROBLEMS_DATA } from './ProblemsView';
import WorkspaceView from './WorkspaceView';
import JudgeDrawer from './JudgeDrawer';
import { ResolutionState } from '../lib/learner/resolution';

export default function ReassessmentUI() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('landing');
  const [activeProblem, setActiveProblem] = useState<ProblemItem>(PROBLEMS_DATA[0]);
  
  // Judge Telemetry State
  const [showJudgeDrawer, setShowJudgeDrawer] = useState<boolean>(false);
  const [telemetryLogs, setTelemetryLogs] = useState<any[]>([]);
  
  // Learner Cognitive Resolution State
  const [learnerResolutionState, setLearnerResolutionState] = useState<ResolutionState>('UNKNOWN');
  const [streakCount, setStreakCount] = useState<number>(7);

  const handleSelectProblem = (problem: ProblemItem) => {
    setActiveProblem(problem);
    setActiveTab('workspace');
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col font-sans selection:bg-[#d7e2ff] selection:text-[#001b3f]">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        streakCount={streakCount}
        showJudgeDrawer={showJudgeDrawer}
        onToggleJudgeDrawer={() => setShowJudgeDrawer(!showJudgeDrawer)}
        solvedCount={learnerResolutionState === 'VERIFIED_RESOLVED' ? 5 : 4}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 w-full">
        {activeTab === 'landing' && (
          <LandingView
            onStartLearning={() => setActiveTab('workspace')}
            onExploreProblems={() => setActiveTab('problems')}
          />
        )}

        {activeTab === 'learn' && (
          <DashboardView
            onStartProblem={() => setActiveTab('workspace')}
            learnerResolutionState={learnerResolutionState}
            streakCount={streakCount}
          />
        )}

        {activeTab === 'problems' && (
          <ProblemsView
            onSelectProblem={handleSelectProblem}
            activeProblemId={activeProblem.id}
          />
        )}

        {activeTab === 'workspace' && (
          <WorkspaceView
            onBackToProblems={() => setActiveTab('problems')}
            onUpdateLearnerState={(state) => setLearnerResolutionState(state)}
            telemetryLogs={telemetryLogs}
            setTelemetryLogs={setTelemetryLogs}
          />
        )}
      </main>

      {/* Slide-over Judge & ML Telemetry Drawer */}
      <JudgeDrawer
        isOpen={showJudgeDrawer}
        onClose={() => setShowJudgeDrawer(false)}
        telemetryLogs={telemetryLogs}
        onClearLogs={() => setTelemetryLogs([])}
      />

      {/* Minimal Apple-Style Footer */}
      <footer className="w-full bg-[#FBFBFD] border-t border-[#E5E5EA] py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#86868B]">
          <p>© 2026 Re:Learn · AI-Powered Misconception-Aware Tutor · Duolingo × Apple × LeetCode</p>
          <div className="flex items-center gap-6">
            <button onClick={() => setActiveTab('landing')} className="hover:text-[#1D1D1F] transition-colors">
              Pedagogy
            </button>
            <button onClick={() => setActiveTab('problems')} className="hover:text-[#1D1D1F] transition-colors">
              Problems
            </button>
            <button onClick={() => setActiveTab('learn')} className="hover:text-[#1D1D1F] transition-colors">
              Curriculum
            </button>
            <button onClick={() => setShowJudgeDrawer(true)} className="hover:text-[#0071e3] transition-colors font-medium">
              ML Inspector
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
