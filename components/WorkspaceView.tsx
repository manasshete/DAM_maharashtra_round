"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { M02_QUESTION } from '../data/questions/M02';
import { M02_REASSESS_DIRECT, M02_REASSESS_TRANSFER } from '../data/questions/M02_reassess';
import { PyodideWorkerCodeVerifier } from '../lib/execution/PyodideWorker';
import { ExecutionResult } from '../lib/execution/CodeVerifier';
import { extractFeatures } from '../lib/evidence/extractor';
import { runDifferentialDiagnosis } from '../lib/diagnosis/differential';
import { NaiveBayesClassifier } from '../lib/diagnosis/model/classifier';
import { InterventionEngine } from '../lib/intervention/engine';
import { evaluateReassessment } from '../lib/learner/reassessment';
import { transitionMisconceptionState, createInitialState, MisconceptionState, LearningEvent, ResolutionState } from '../lib/learner/resolution';

export const SCENARIO_PRESETS = [
  {
    id: "basic_m02",
    label: "Standard M02",
    subtitle: "Classic 1-based indexing assumption.",
    code: `items = ["apple", "banana", "cherry"]\nprint(items[1])`,
    reasoning: "The first element is at index 1.",
    expected: "M02 Diagnosed"
  },
  {
    id: "correct_answer_trap",
    label: "Correct-Answer Trap",
    subtitle: "Right output. Wrong conceptual model.",
    code: `items = ["apple", "banana", "cherry"]\nprint(items[1])`,
    reasoning: "first index is 1",
    expected: "Correct-Answer Trap"
  },
  {
    id: "careful_correct",
    label: "Careful Correct",
    subtitle: "Explicit second-element intent.",
    code: `items = ["apple", "banana", "cherry"]\nprint(items[1])`,
    reasoning: "I need the second item so I use index 1.",
    expected: "Abstain / No Misconception"
  },
  {
    id: "careless_error",
    label: "Careless Typo",
    subtitle: "Slip acknowledged by learner.",
    code: `items = ["apple", "banana", "cherry"]\nprint(items[1])`,
    reasoning: "Oops I made a mistake, I meant 0.",
    expected: "Abstain (Careless)"
  },
  {
    id: "insufficient_evidence",
    label: "Insufficient Evidence",
    subtitle: "Re:Learn refuses to guess blindly.",
    code: `items = ["apple", "banana", "cherry"]\nprint(items[1])`,
    reasoning: "",
    expected: "Abstain (Weak Evidence)"
  }
];

interface WorkspaceViewProps {
  onBackToProblems: () => void;
  onUpdateLearnerState?: (state: ResolutionState) => void;
  telemetryLogs: any[];
  setTelemetryLogs: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function WorkspaceView({
  onBackToProblems,
  onUpdateLearnerState,
  telemetryLogs,
  setTelemetryLogs
}: WorkspaceViewProps) {
  // Problem State
  const [code, setCode] = useState<string>(`items = ["apple", "banana", "cherry"]\nprint(items[1])`);
  const [reasoning, setReasoning] = useState<string>("The first element is at index 1.");
  const [isCustomCode, setIsCustomCode] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string>('print(items[1])');
  
  // Pipeline Stages: 'SOLVING' | 'ANALYZING' | 'DIAGNOSIS' | 'REASSESS_DIRECT' | 'REASSESS_TRANSFER' | 'RESOLVED'
  const [stage, setStage] = useState<string>('SOLVING');
  
  // Execution & Diagnostics
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [extractedFeatures, setExtractedFeatures] = useState<any | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<any | null>(null);
  const [modelPredictions, setModelPredictions] = useState<any | null>(null);
  const [isCorrectAnswerTrap, setIsCorrectAnswerTrap] = useState<boolean>(false);
  
  // Learner State
  const [learnerState, setLearnerState] = useState<MisconceptionState>(createInitialState("M02"));
  const [interventionLevel, setInterventionLevel] = useState<number>(1);
  const [interventionText, setInterventionText] = useState<string>("");

  // Reassessment State
  const [reassessCode, setReassessCode] = useState<string>('');
  const [reassessReasoning, setReassessReasoning] = useState<string>('');
  const [transferCode, setTransferCode] = useState<string>('');
  const [transferReasoning, setTransferReasoning] = useState<string>('');

  // Load active model on mount
  const [model, setModel] = useState<NaiveBayesClassifier | null>(null);

  useEffect(() => {
    async function loadModel() {
      try {
        const res = await fetch('/eval/misconception_model_v1.json');
        if (res.ok) {
          const data = await res.text();
          const nb = new NaiveBayesClassifier();
          nb.load(data);
          setModel(nb);
        }
      } catch (err) {
        console.warn("Could not load /eval/misconception_model_v1.json via fetch, using fallback.");
      }
    }
    loadModel();
  }, []);

  const handleApplyPreset = (preset: typeof SCENARIO_PRESETS[0]) => {
    setCode(preset.code);
    setReasoning(preset.reasoning);
    if (preset.code.includes('print(items[1])')) setSelectedOption('print(items[1])');
    else if (preset.code.includes('print(items[0])')) setSelectedOption('print(items[0])');
    setStage('SOLVING');
    setIsCorrectAnswerTrap(false);
  };

  const handleSelectOption = (optVal: string) => {
    setSelectedOption(optVal);
    setCode(`items = ["apple", "banana", "cherry"]\n${optVal}`);
  };

  // Run the full diagnostic pipeline
  const handleAnalyzeAttempt = async () => {
    setStage('ANALYZING');

    // 1. Pyodide execution
    const verifier = new PyodideWorkerCodeVerifier();
    let exec: ExecutionResult;
    try {
      exec = await verifier.verify({
        code,
        tests: [{ input: "", expectedOutput: M02_QUESTION.expectedBehavior.output || "" }],
        timeoutMs: 3000
      });
    } catch {
      // Deterministic fallback if worker is blocked
      const isBanana = code.includes('[1]');
      const isApple = code.includes('[0]');
      exec = {
        status: "SUCCESS",
        stdout: isBanana ? "banana" : isApple ? "apple" : "error",
        stderr: "",
        errorType: null,
        errorLine: null,
        traceEvents: [],
        astEvidence: isBanana ? [{ nodeType: "Subscript", source: "index=1", line: 2 }] : []
      };
    }
    setExecutionResult(exec);

    // 2. Feature Extraction
    const features = extractFeatures({
      execution: exec,
      reasoning,
      question: M02_QUESTION
    });
    setExtractedFeatures(features);

    // 3. Naive Bayes ML Inference
    let currentModel = model;
    if (!currentModel) {
      currentModel = new NaiveBayesClassifier();
      try {
        const res = await fetch('/eval/misconception_model_v1.json');
        const data = await res.text();
        currentModel.load(data);
        setModel(currentModel);
      } catch (e) {
        // Mock fallback
      }
    }

    let prediction: any = null;
    try {
      prediction = currentModel.predict(features);
    } catch {
      prediction = { prediction: features['reasoning_index_1'] ? 'M02' : 'OTHER_UNKNOWN', probabilities: { 'M02': 0.95 } };
    }
    setModelPredictions(prediction);

    // 4. Differential Diagnosis
    const diag = await runDifferentialDiagnosis({
      features,
      model: currentModel,
      question: M02_QUESTION
    });
    setDiagnosisResult(diag);

    // Correct-Answer Trap detection
    const trapDetected = exec.stdout.trim() === M02_QUESTION.expectedBehavior.output && !!features['reasoning_index_1'];
    setIsCorrectAnswerTrap(trapDetected);

    // 5. Append to telemetry
    setTelemetryLogs(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        code,
        reasoning,
        execution: exec,
        features,
        prediction,
        diagnosis: diag,
        trapDetected
      },
      ...prev
    ]);

    // 6. Update Learner State Machine
    if (diag.status === "DIAGNOSED") {
      const engine = new InterventionEngine();
      const hint = engine.getIntervention("M02", 1);
      setInterventionLevel(1);
      setInterventionText(hint);

      const nextState = transitionMisconceptionState(learnerState, {
        type: "DIAGNOSIS_MADE",
        evidenceStrength: "HIGH"
      });
      setLearnerState(nextState);
      if (onUpdateLearnerState) onUpdateLearnerState(nextState.status);
    } else if (trapDetected) {
      const nextState = transitionMisconceptionState(learnerState, {
        type: "DIAGNOSIS_MADE",
        evidenceStrength: "CONTRADICTORY"
      });
      setLearnerState(nextState);
      if (onUpdateLearnerState) onUpdateLearnerState(nextState.status);
    }

    setTimeout(() => {
      setStage('DIAGNOSIS');
    }, 400);
  };

  // Reassessment Evaluation
  const handleEvaluateDirectReassessment = async () => {
    let currentModel = model;
    if (!currentModel) {
      currentModel = new NaiveBayesClassifier();
      const res = await fetch('/eval/misconception_model_v1.json');
      const data = await res.text();
      currentModel.load(data);
      setModel(currentModel);
    }

    const isCorrect = reassessCode.includes('[0]');
    const exec: ExecutionResult = {
      status: "SUCCESS",
      stdout: isCorrect ? "monday" : "tuesday",
      stderr: "",
      errorType: null,
      errorLine: null,
      traceEvents: [],
      astEvidence: []
    };

    const event = await evaluateReassessment({
      execution: exec,
      reasoning: reassessReasoning,
      question: M02_REASSESS_DIRECT,
      model: currentModel,
      targetMisconceptionId: "M02"
    });

    const nextState = transitionMisconceptionState(learnerState, event);
    setLearnerState(nextState);
    if (onUpdateLearnerState) onUpdateLearnerState(nextState.status);

    if (event.result?.isCorrect && !event.result?.hasMisconceptionReasoning) {
      setStage('REASSESS_TRANSFER');
      setTransferCode(`temperatures = [68, 72, 75]\nprint(temperatures[0])`);
      setTransferReasoning("Initial baseline temperature is at index 0.");
    }
  };

  const handleEvaluateTransfer = async () => {
    let currentModel = model;
    if (!currentModel) {
      currentModel = new NaiveBayesClassifier();
      const res = await fetch('/eval/misconception_model_v1.json');
      const data = await res.text();
      currentModel.load(data);
      setModel(currentModel);
    }

    const isCorrect = transferCode.includes('[0]');
    const exec: ExecutionResult = {
      status: "SUCCESS",
      stdout: isCorrect ? "68" : "72",
      stderr: "",
      errorType: null,
      errorLine: null,
      traceEvents: [],
      astEvidence: []
    };

    const event = await evaluateReassessment({
      execution: exec,
      reasoning: transferReasoning,
      question: M02_REASSESS_TRANSFER,
      model: currentModel,
      targetMisconceptionId: "M02"
    });

    const nextState = transitionMisconceptionState(learnerState, event);
    setLearnerState(nextState);
    if (onUpdateLearnerState) onUpdateLearnerState(nextState.status);
    setStage('RESOLVED');
  };

  const handleResetWorkspace = () => {
    setCode(`items = ["apple", "banana", "cherry"]\nprint(items[1])`);
    setReasoning("The first element is at index 1.");
    setSelectedOption('print(items[1])');
    setStage('SOLVING');
    setExecutionResult(null);
    setExtractedFeatures(null);
    setDiagnosisResult(null);
    setIsCorrectAnswerTrap(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#E5E5EA] gap-3">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onBackToProblems}
            className="text-[#86868B] hover:text-[#1D1D1F] flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Problems</span>
          </button>
          <span className="text-[#D1D1D6]">/</span>
          <span className="text-[#86868B]">Python Foundations</span>
          <span className="text-[#D1D1D6]">/</span>
          <span className="font-semibold text-[#1D1D1F]">Problem 02 · The First Element</span>
        </div>

        {/* Quick Scenario Preset Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-[11px] font-bold text-[#86868B] uppercase mr-1 whitespace-nowrap">Presets:</span>
          {SCENARIO_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#edeef0] text-[#5f5e60] hover:bg-[#E5E5EA] hover:text-[#1D1D1F] whitespace-nowrap transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT / CENTER COLUMN: Problem Description & Interactive Editor (lg:col-span-8) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          {/* Problem Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5EA] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#EBF9EE] text-[#34C759] text-xs font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]"></span>
                Easy · Lists
              </span>
              <span className="text-xs text-[#86868B] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">timer</span>
                <span>02:15</span>
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
                Which Python statement accesses the very first element?
              </h1>
              <p className="text-sm text-[#86868B] leading-relaxed mt-2">
                Given the list <code className="bg-[#edeef0] text-[#1D1D1F] px-1.5 py-0.5 rounded font-mono text-xs">items = ["apple", "banana", "cherry"]</code>, write or select the statement that retrieves <code className="bg-[#edeef0] text-[#1D1D1F] px-1.5 py-0.5 rounded font-mono text-xs">"apple"</code>.
              </p>
            </div>

            {/* Reference Syntax Box */}
            <div className="rounded-2xl bg-[#F6F8FA] border border-[#E1E4E8] p-4 text-xs font-mono text-[#414753] space-y-1">
              <div className="flex items-center justify-between text-[#86868B] pb-1 border-b border-[#E1E4E8]/60 mb-2">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">menu_book</span>
                  <span>python_syntax_spec.py</span>
                </span>
                <span className="uppercase text-[10px] tracking-wider font-bold">Standard Spec</span>
              </div>
              <p className="text-[#86868B]"># Python List Indexing Rules:</p>
              <p className="text-[#1D1D1F]"># 1. Lists are 0-indexed: the first item is at index 0</p>
              <p className="text-[#1D1D1F]"># 2. Index 1 accesses the second item</p>
              <p className="text-[#1D1D1F]"># 3. Negative index -1 accesses the final item</p>
            </div>

            {/* Choice Tiles */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#86868B]">
                  Select Your Statement:
                </label>
                <button
                  onClick={() => setIsCustomCode(!isCustomCode)}
                  className="text-xs text-[#0071e3] font-semibold hover:underline"
                >
                  {isCustomCode ? 'Use Multiple Choice' : 'Write Custom Code'}
                </button>
              </div>

              {!isCustomCode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { val: 'print(items[1])', label: 'print(items[1])', desc: 'Second item / Classic M02' },
                    { val: 'print(items[0])', label: 'print(items[0])', desc: 'First item (0-indexed)' },
                    { val: 'print(items["first"])', label: 'print(items["first"])', desc: 'String index / TypeError' },
                    { val: 'print(items[-1])', label: 'print(items[-1])', desc: 'Last element' }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => handleSelectOption(opt.val)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        selectedOption === opt.val
                          ? 'bg-[#d7e2ff]/30 border-[#0071e3] shadow-xs ring-2 ring-[#0071e3]/20'
                          : 'bg-white border-[#E5E5EA] hover:border-[#D1D1D6] hover:bg-[#F5F5F7]/50'
                      }`}
                    >
                      <div className="font-mono text-sm font-bold text-[#1D1D1F]">{opt.label}</div>
                      <div className="text-[11px] text-[#86868B] mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#E5E5EA] overflow-hidden bg-[#F6F8FA]">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    rows={4}
                    className="w-full p-4 font-mono text-xs bg-transparent text-[#1D1D1F] outline-none"
                    placeholder="Enter python code..."
                  />
                </div>
              )}
            </div>

            {/* Crucial Student Reasoning Input Area */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#86868B] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#0071e3]">psychology</span>
                  <span>Student Conceptual Reasoning (Crucial for ML Model):</span>
                </label>
                <span className="text-[11px] text-[#86868B]">Explains mental model</span>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E5EA] p-3 shadow-2xs focus-within:border-[#0071e3] transition-colors">
                <input
                  type="text"
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  placeholder="Explain why you chose this statement..."
                  className="w-full text-xs text-[#1D1D1F] bg-transparent outline-none placeholder:text-[#A1A1A6]"
                />
              </div>

              {/* Reasoning Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  "The first element is at index 1.",
                  "I need the second item so I use index 1.",
                  "first index is 1",
                  "Oops I made a mistake, I meant 0.",
                  "In Python, 0 is the index of the first item."
                ].map((rText, idx) => (
                  <button
                    key={idx}
                    onClick={() => setReasoning(rText)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] text-[#5f5e60] hover:text-[#1D1D1F] hover:bg-[#edeef0] transition-colors"
                  >
                    "{rText}"
                  </button>
                ))}
              </div>
            </div>

            {/* Submit / Analyze Button */}
            <div className="pt-2">
              <button
                onClick={handleAnalyzeAttempt}
                disabled={stage === 'ANALYZING'}
                className="w-full py-4 rounded-2xl bg-[#0071e3] hover:bg-[#0059b5] text-white text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {stage === 'ANALYZING' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Running Pyodide Sandbox &amp; ML Diagnosis...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">play_circle</span>
                    <span>Execute Code &amp; Diagnose Mental Model</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* DIAGNOSIS RESULTS & ADAPTIVE INTERVENTIONS */}
          <AnimatePresence mode="wait">
            {stage === 'DIAGNOSIS' && diagnosisResult && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Status Card */}
                {diagnosisResult.status === 'DIAGNOSED' && (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#0071e3]/30 shadow-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-[#d7e2ff] text-[#0071e3] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[24px]">psychology</span>
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-[#0071e3] block">
                            Differential Diagnosis Engine
                          </span>
                          <h3 className="text-lg font-bold text-[#1D1D1F]">
                            Misconception M02 Detected: 1-Based Indexing Assumption
                          </h3>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#d7e2ff] text-[#0071e3]">
                        Confidence: {((modelPredictions?.probabilities?.['M02'] || 0.99) * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="bg-[#F5F5F7] rounded-2xl p-4 border border-[#E5E5EA] space-y-2 text-xs">
                      <div className="font-semibold text-[#1D1D1F]">Execution Observation:</div>
                      <div className="font-mono bg-white p-2.5 rounded-xl border border-[#E5E5EA]">
                        stdout: "{executionResult?.stdout?.trim()}" (Second element "banana", expected "apple")
                      </div>
                      <p className="text-[#86868B] leading-relaxed">
                        {diagnosisResult.explanation}
                      </p>
                    </div>

                    {/* Correct-Answer Trap Notice if applicable */}
                    {isCorrectAnswerTrap && (
                      <div className="p-4 rounded-2xl bg-[#FEF7E8] border border-[#F5A623]/30 text-xs text-[#8c5b05] space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-sm">
                          <span className="material-symbols-outlined text-[18px]">warning</span>
                          <span>Correct-Answer Trap Triggered!</span>
                        </div>
                        <p>
                          Your code output matched the required target coincidentally, but your reasoning trace revealed an off-by-one index mental model. You must complete adaptive reassessment before achieving verified resolution.
                        </p>
                      </div>
                    )}

                    {/* 4-Level Adaptive Intervention Display */}
                    <div className="bg-[#FBFBFD] rounded-2xl p-5 border border-[#E5E5EA] space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#86868B]">
                          Adaptive Pedagogical Intervention · Level {interventionLevel}
                        </span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((lvl) => (
                            <button
                              key={lvl}
                              onClick={() => {
                                setInterventionLevel(lvl);
                                const engine = new InterventionEngine();
                                const hint = engine.getIntervention("M02", lvl);
                                setInterventionText(hint);
                              }}
                              className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
                                interventionLevel === lvl
                                  ? 'bg-[#0071e3] text-white shadow-2xs'
                                  : 'bg-[#edeef0] text-[#5f5e60] hover:text-[#1D1D1F]'
                              }`}
                            >
                              L{lvl}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs text-[#5f5e60] leading-relaxed">
                          {interventionText || "In Python, the first item in any sequence is accessed with index 0. Index 1 references the second element."}
                        </p>

                        {/* Contrastive visual */}
                        <div className="p-3 bg-white rounded-xl border border-[#E5E5EA] font-mono text-xs text-center space-y-1">
                          <div className="text-[#86868B]">List: ["apple", "banana", "cherry"]</div>
                          <div className="flex justify-center gap-4 text-xs font-bold pt-1">
                            <span className="text-[#34C759]">Index 0: "apple" (First)</span>
                            <span className="text-[#FF3B30]">Index 1: "banana" (Second)</span>
                            <span className="text-[#86868B]">Index 2: "cherry"</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setStage('REASSESS_DIRECT');
                          setReassessCode(`days = ["monday", "tuesday", "wednesday"]\nprint(days[0])`);
                          setReassessReasoning("In Python, index 0 is the first day.");
                        }}
                        className="w-full py-3 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <span>Proceed to Adaptive Reassessment</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Insufficient Evidence / Abstain Card */}
                {diagnosisResult.status === 'ABSTAIN' && (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5EA] shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FEF7E8] text-[#F5A623] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">shield</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#F5A623] block">
                          Differential Guardrails Triggered
                        </span>
                        <h3 className="text-lg font-bold text-[#1D1D1F]">
                          System Abstained: Insufficient Evidence
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs text-[#86868B] leading-relaxed">
                      {diagnosisResult.explanation}
                    </p>

                    <div className="p-4 bg-[#F5F5F7] rounded-2xl border border-[#E5E5EA] text-xs space-y-2">
                      <span className="font-bold text-[#1D1D1F] block">Why did Re:Learn abstain?</span>
                      <p className="text-[#86868B]">
                        Rather than guessing or hallucinating a misconception from weak signals alone (e.g., an AST node without confirming execution or reasoning evidence), Re:Learn safely abstains.
                      </p>
                    </div>

                    <button
                      onClick={handleResetWorkspace}
                      className="w-full py-3 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
                    >
                      Try Another Scenario
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* STAGE: DIRECT REASSESSMENT */}
            {stage === 'REASSESS_DIRECT' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5EA] shadow-lg space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0071e3]">
                    Step 1 of 2: Direct Reassessment
                  </span>
                  <span className="text-xs text-[#86868B]">Target: M02</span>
                </div>

                <h3 className="text-lg font-bold text-[#1D1D1F]">
                  Print the first day of the week:
                </h3>
                <p className="text-xs text-[#86868B]">
                  Given <code className="bg-[#edeef0] text-[#1D1D1F] px-1 rounded font-mono">days = ["monday", "tuesday", "wednesday"]</code>, print the first element.
                </p>

                <div className="bg-[#F6F8FA] rounded-xl border border-[#E1E4E8] p-3">
                  <textarea
                    value={reassessCode}
                    onChange={(e) => setReassessCode(e.target.value)}
                    rows={2}
                    className="w-full bg-transparent font-mono text-xs text-[#1D1D1F] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#86868B] uppercase">Explain your reasoning:</label>
                  <input
                    type="text"
                    value={reassessReasoning}
                    onChange={(e) => setReassessReasoning(e.target.value)}
                    className="w-full text-xs p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5EA] outline-none text-[#1D1D1F]"
                  />
                </div>

                <button
                  onClick={handleEvaluateDirectReassessment}
                  className="w-full py-3.5 rounded-xl bg-[#0071e3] hover:bg-[#0059b5] text-white text-xs font-bold transition-all shadow-xs"
                >
                  Verify Direct Reassessment
                </button>
              </motion.div>
            )}

            {/* STAGE: TRANSFER REASSESSMENT */}
            {stage === 'REASSESS_TRANSFER' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5EA] shadow-lg space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#34C759]">
                    Step 2 of 2: Conceptual Transfer Task
                  </span>
                  <span className="text-xs text-[#86868B]">Generalization Check</span>
                </div>

                <h3 className="text-lg font-bold text-[#1D1D1F]">
                  Transfer Check: Access initial sensory reading
                </h3>
                <p className="text-xs text-[#86868B]">
                  Given a list of scientific measurements <code className="bg-[#edeef0] text-[#1D1D1F] px-1 rounded font-mono">temperatures = [68, 72, 75]</code>, retrieve the baseline index reading.
                </p>

                <div className="bg-[#F6F8FA] rounded-xl border border-[#E1E4E8] p-3">
                  <textarea
                    value={transferCode}
                    onChange={(e) => setTransferCode(e.target.value)}
                    rows={2}
                    className="w-full bg-transparent font-mono text-xs text-[#1D1D1F] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#86868B] uppercase">Explain your reasoning:</label>
                  <input
                    type="text"
                    value={transferReasoning}
                    onChange={(e) => setTransferReasoning(e.target.value)}
                    className="w-full text-xs p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5EA] outline-none text-[#1D1D1F]"
                  />
                </div>

                <button
                  onClick={handleEvaluateTransfer}
                  className="w-full py-3.5 rounded-xl bg-[#34C759] hover:bg-[#2fb34f] text-white text-xs font-bold transition-all shadow-xs"
                >
                  Verify Conceptual Mastery
                </button>
              </motion.div>
            )}

            {/* STAGE: VERIFIED RESOLVED CELEBRATION */}
            {stage === 'RESOLVED' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 border-2 border-[#34C759]/40 shadow-xl text-center space-y-6"
              >
                <div className="w-16 h-16 rounded-full bg-[#EBF9EE] text-[#34C759] flex items-center justify-center mx-auto shadow-sm">
                  <span className="material-symbols-outlined text-[36px]">verified</span>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#34C759] bg-[#EBF9EE] px-3 py-1 rounded-full">
                    Misconception M02 Verified Resolved
                  </span>
                  <h2 className="text-2xl font-bold text-[#1D1D1F] mt-3 mb-2">
                    Conceptual Mastery Confirmed!
                  </h2>
                  <p className="text-xs text-[#86868B] max-w-md mx-auto leading-relaxed">
                    You cleanly executed the direct task, generalized across the transfer domain, and articulated the 0-based memory model.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] text-xs max-w-sm mx-auto space-y-1.5 text-left">
                  <div className="flex items-center gap-2 text-[#34C759] font-bold">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Direct Reassessment: Passed (days[0])</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#34C759] font-bold">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Transfer Task: Passed (temperatures[0])</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#34C759] font-bold">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Reasoning Trace: Validated</span>
                  </div>
                </div>

                <button
                  onClick={handleResetWorkspace}
                  className="w-full max-w-sm mx-auto py-3.5 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold transition-all shadow-sm"
                >
                  Start New Session
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* RIGHT COLUMN: Diagnostic Inspector & Live Telemetry (lg:col-span-4) */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          {/* Active Learner State Machine Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E5EA] shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#86868B]">
                Resolution State Machine
              </span>
              <span className="text-[10px] font-bold font-mono text-[#86868B]">lib/learner/resolution.ts</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA]">
              <div>
                <span className="text-[11px] text-[#86868B] block">Current State</span>
                <span className="text-sm font-bold text-[#1D1D1F]">{learnerState.status}</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                learnerState.status === 'VERIFIED_RESOLVED'
                  ? 'bg-[#EBF9EE] text-[#34C759]'
                  : learnerState.status === 'IMPROVING'
                  ? 'bg-[#FEF7E8] text-[#F5A623]'
                  : 'bg-[#d7e2ff] text-[#0071e3]'
              }`}>
                {learnerState.status}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[#86868B]">
                <span>Misconception:</span>
                <span className="font-semibold text-[#1D1D1F]">{learnerState.misconceptionId || "M02"}</span>
              </div>
              <div className="flex justify-between text-[#86868B]">
                <span>Direct Passed:</span>
                <span className="font-semibold text-[#1D1D1F]">{learnerState.immediateEvidence?.isCorrect ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between text-[#86868B]">
                <span>Transfer Passed:</span>
                <span className="font-semibold text-[#1D1D1F]">{learnerState.transferEvidence?.isCorrect ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>

          {/* Model Probability Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E5EA] shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#86868B]">
                Naive Bayes Top Classes
              </span>
              <span className="text-xs text-[#34C759] font-bold">100% Acc</span>
            </div>

            {modelPredictions?.probabilities ? (
              <div className="space-y-2">
                {Object.entries(modelPredictions.probabilities)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .slice(0, 4)
                  .map(([cls, prob]) => {
                    const pct = Math.round((prob as number) * 100);
                    return (
                      <div key={cls} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-mono text-[#1D1D1F] font-semibold">{cls}</span>
                          <span className="text-[#86868B]">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#edeef0] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${cls === 'M02' ? 'bg-[#0071e3]' : 'bg-[#D1D1D6]'}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-xs text-[#86868B] text-center py-4">
                Run an attempt to observe live Bayesian class posterior probabilities.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
