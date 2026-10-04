"use client";
import React, { useState } from 'react';

export interface ProblemItem {
  id: string;
  number: string;
  title: string;
  concept: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  reasoningCheck: string;
  status: 'solved' | 'active' | 'locked';
  misconceptionTarget?: string;
  description: string;
}

export const PROBLEMS_DATA: ProblemItem[] = [
  {
    id: "q_m02_basic",
    number: "02.",
    title: "The First Element",
    concept: "Lists",
    difficulty: "Easy",
    reasoningCheck: "0-based indexing model",
    status: "active",
    misconceptionTarget: "M02",
    description: "Access the very first element of a non-empty Python list."
  },
  {
    id: "q_var_01",
    number: "01.",
    title: "What is a variable?",
    concept: "Variables",
    difficulty: "Easy",
    reasoningCheck: "Name binding model",
    status: "solved",
    description: "Distinguish between legal identifier structures and reserved keywords."
  },
  {
    id: "q_m01_range",
    number: "03.",
    title: "Counting with Range",
    concept: "Loops",
    difficulty: "Easy",
    reasoningCheck: "Default start index model",
    status: "active",
    misconceptionTarget: "M01",
    description: "Understand whether range(N) begins counting from 0 or 1."
  },
  {
    id: "q_m03_slice",
    number: "04.",
    title: "Slicing Subsets",
    concept: "Lists",
    difficulty: "Medium",
    reasoningCheck: "Exclusive endpoint boundary",
    status: "active",
    misconceptionTarget: "M03",
    description: "Examine whether slice notation items[0:3] includes index 3."
  },
  {
    id: "q_var_02",
    number: "05.",
    title: "Variable Reassignment",
    concept: "Variables",
    difficulty: "Easy",
    reasoningCheck: "Reference pointer updates",
    status: "solved",
    description: "Trace how updating a pointer alters memory references without copying."
  },
  {
    id: "q_lists_bounds",
    number: "06.",
    title: "Index Out of Range",
    concept: "Lists",
    difficulty: "Easy",
    reasoningCheck: "Length vs index limits",
    status: "active",
    description: "Identify why accessing index len(items) raises an IndexError."
  },
  {
    id: "q_cond_01",
    number: "07.",
    title: "Conditional Truthiness",
    concept: "Conditionals",
    difficulty: "Easy",
    reasoningCheck: "Boolean coercion model",
    status: "solved",
    description: "Evaluate truthiness of empty collections and numeric zero in Python."
  },
  {
    id: "q_nested_01",
    number: "08.",
    title: "Nested Matrix Addressing",
    concept: "Lists",
    difficulty: "Hard",
    reasoningCheck: "2D Row-Major traversal",
    status: "locked",
    description: "Navigate two-dimensional arrays using sequential index operators."
  }
];

interface ProblemsViewProps {
  onSelectProblem: (problem: ProblemItem) => void;
  activeProblemId?: string;
}

export default function ProblemsView({ onSelectProblem, activeProblemId = "q_m02_basic" }: ProblemsViewProps) {
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterConcept, setFilterConcept] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredProblems = PROBLEMS_DATA.filter((p) => {
    if (filterDifficulty === "solved" && p.status !== "solved") return false;
    if (filterDifficulty !== "all" && filterDifficulty !== "solved" && p.difficulty !== filterDifficulty) return false;
    if (filterConcept && p.concept !== filterConcept) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.concept.toLowerCase().includes(q) ||
        p.reasoningCheck.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const solvedCount = PROBLEMS_DATA.filter(p => p.status === "solved").length;
  const totalCount = PROBLEMS_DATA.length;
  const progressPercent = Math.round((solvedCount / totalCount) * 100);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Layout Grid: 75% Left Table, 25% Right Context Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Dominant Main Panel */}
        <section className="lg:col-span-9 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#86868B] uppercase tracking-wider">Curriculum Catalog</span>
              <h1 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Problems</h1>
            </div>

            {/* Solved Metric Snapshot */}
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-[#E5E5EA] shadow-2xs">
              <span className="text-xs text-[#86868B]">Solved:</span>
              <span className="text-xs font-semibold text-[#1D1D1F]">{solvedCount} / {totalCount}</span>
              <div className="w-16 h-1.5 bg-[#edeef0] rounded-full overflow-hidden">
                <div className="h-full bg-[#0071e3] rounded-full" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
          </div>

          {/* Controls: Difficulty Tabs + Search & Concepts Dropdown */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#edeef0] rounded-full overflow-x-auto">
              {['all', 'Easy', 'Medium', 'Hard', 'solved'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterDifficulty(f)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    filterDifficulty === f
                      ? 'bg-white text-[#1D1D1F] shadow-2xs'
                      : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'solved' ? 'Completed' : f}
                </button>
              ))}
            </div>

            {/* Search & Concepts */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1A6] text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white text-[#1D1D1F] placeholder:text-[#A1A1A6] text-xs rounded-full border border-[#E5E5EA] focus:outline-none focus:ring-1 focus:ring-[#0071e3] transition-all shadow-2xs"
                />
              </div>

              <div className="relative">
                <select
                  value={filterConcept}
                  onChange={(e) => setFilterConcept(e.target.value)}
                  className="appearance-none bg-white text-[#1D1D1F] text-xs font-medium py-1.5 pl-3.5 pr-8 rounded-full border border-[#E5E5EA] shadow-2xs focus:outline-none cursor-pointer"
                >
                  <option value="">All Concepts</option>
                  <option value="Variables">Variables</option>
                  <option value="Lists">Lists</option>
                  <option value="Conditionals">Conditionals</option>
                  <option value="Loops">Loops</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86868B] pointer-events-none text-[16px]">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* High-Density Tabular View */}
          <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F5F7] text-[#86868B] text-xs font-semibold uppercase tracking-wider border-b border-[#E5E5EA]">
                    <th className="py-3 pl-4 pr-2 w-12 text-center">Status</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Concept</th>
                    <th className="py-3 px-3">Difficulty</th>
                    <th className="py-3 px-4">Reasoning Check</th>
                    <th className="py-3 pr-4 pl-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5EA] text-sm text-[#1D1D1F]">
                  {filteredProblems.map((p) => {
                    const isTarget = p.id === activeProblemId;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => onSelectProblem(p)}
                        className={`hover:bg-[#F5F5F7]/80 transition-colors group cursor-pointer ${
                          isTarget ? 'bg-[#d7e2ff]/20' : ''
                        }`}
                      >
                        {/* Status */}
                        <td className="py-3.5 pl-4 pr-2 text-center">
                          {p.status === 'solved' ? (
                            <span className="material-symbols-outlined text-[#34C759] text-[20px]">check_circle</span>
                          ) : p.status === 'locked' ? (
                            <span className="material-symbols-outlined text-[#A1A1A6] text-[18px]">lock</span>
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#0071e3] inline-block"></span>
                          )}
                        </td>

                        {/* Title */}
                        <td className="py-3.5 px-4 font-medium group-hover:text-[#0071e3] transition-colors">
                          <span className="text-[#A1A1A6] font-mono text-xs mr-1.5">{p.number}</span>
                          {p.title}
                          {p.misconceptionTarget && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#d7e2ff] text-[#0071e3]">
                              {p.misconceptionTarget}
                            </span>
                          )}
                        </td>

                        {/* Concept */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#edeef0] text-[#5f5e60]">
                            {p.concept}
                          </span>
                        </td>

                        {/* Difficulty */}
                        <td className="py-3.5 px-3">
                          <span className={`text-xs font-semibold ${
                            p.difficulty === 'Easy' ? 'text-[#34C759]' : p.difficulty === 'Medium' ? 'text-[#F5A623]' : 'text-[#FF3B30]'
                          }`}>
                            {p.difficulty}
                          </span>
                        </td>

                        {/* Reasoning Check */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 text-[#5f5e60] text-xs bg-[#edeef0]/60 px-2.5 py-1 rounded-md border border-[#E5E5EA]">
                            <span className="text-xs">🧠</span>
                            <span>{p.reasoningCheck}</span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 pr-4 pl-2 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProblem(p);
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                              p.status === 'locked'
                                ? 'bg-transparent text-[#A1A1A6] cursor-not-allowed'
                                : 'bg-[#1D1D1F] text-white hover:bg-black group-hover:bg-[#0071e3]'
                            }`}
                          >
                            {p.status === 'solved' ? 'Review' : 'Solve'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Right Context Rail: Misconception Radar & System Architecture */}
        <aside className="lg:col-span-3 flex flex-col gap-6">
          {/* Target Highlight */}
          <div className="bg-white rounded-2xl p-5 border border-[#E5E5EA] shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0071e3] bg-[#d7e2ff] px-2 py-0.5 rounded">
              Active Focus
            </span>
            <h3 className="font-bold text-base text-[#1D1D1F] mt-2 mb-1">M02: First Index Assumption</h3>
            <p className="text-xs text-[#86868B] leading-relaxed mb-4">
              Students naturally assume lists start at 1. Re:Learn tests both direct application and transfer conceptual reasoning.
            </p>
            <button
              onClick={() => onSelectProblem(PROBLEMS_DATA[0])}
              className="w-full py-2 px-3 bg-[#0071e3] hover:bg-[#0059b5] text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs"
            >
              Open Problem 02
            </button>
          </div>

          {/* Diagnostic Architecture */}
          <div className="bg-white rounded-2xl p-5 border border-[#E5E5EA] shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#86868B]">Diagnostic Pipeline</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-[#F5F5F7] rounded-lg">
                <span className="text-[#34C759] font-bold">1.</span>
                <span>Pyodide WebWorker Sandbox</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#F5F5F7] rounded-lg">
                <span className="text-[#0071e3] font-bold">2.</span>
                <span>Deterministic Evidence Extractor</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#F5F5F7] rounded-lg">
                <span className="text-purple-600 font-bold">3.</span>
                <span>Trained Naive Bayes (100% Acc)</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#F5F5F7] rounded-lg">
                <span className="text-amber-600 font-bold">4.</span>
                <span>Differential Guardrails</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#F5F5F7] rounded-lg">
                <span className="text-emerald-600 font-bold">5.</span>
                <span>Correct-Answer Trap Evaluator</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
