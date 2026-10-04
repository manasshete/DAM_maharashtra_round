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
import { CheckCircle2, ChevronRight, RotateCcw, Search, Brain, ShieldCheck, FileCode, Check, X, Activity, Code2, ArrowRight } from 'lucide-react';

const SCENARIOS = [
  {
    id: "correct_answer_trap",
    label: "Correct Answer Trap",
    subtitle: "Correct output. Wrong mental model.",
    code: `items = ["apple", "banana", "cherry"]\nprint(items[1])`,
    reasoning: "first index is 1",
  },
  {
    id: "basic_m02",
    label: "Basic M02",
    subtitle: "Standard misconception behavior.",
    code: `items = ["apple", "banana", "cherry"]\nprint(items[1])`,
    reasoning: "I want the first item so I use 1",
  },
  {
    id: "insufficient_evidence",
    label: "Insufficient Evidence",
    subtitle: "Re:Learn refuses to guess.",
    code: `items = ["apple", "banana", "cherry"]\nprint(items[0])`,
    reasoning: "",
  },
  {
    id: "transfer_failure",
    label: "Transfer Failure",
    subtitle: "Initial success does not generalize.",
    code: `items = ["apple", "banana", "cherry"]\nprint(items[1])`,
    reasoning: "first index is 1",
  },
  {
    id: "verified_resolution",
    label: "Verified Resolution",
    subtitle: "Learns and generalizes correctly.",
    code: `items = ["apple", "banana", "cherry"]\nprint(items[1])`,
    reasoning: "first index is 1",
  }
];

function printJudgeTraceInitial(data: any) {
  if (!data.isJudgeTrace) return;

  console.groupCollapsed("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nRE:LEARN · ML DIAGNOSIS TRACE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color:#8b5cf6; font-weight:bold");
  
  console.group("%c[ATTEMPT]", "font-weight:bold");
  console.log(`Question: ${data.question?.id} (${data.question?.concept})`);
  console.log(`Code:\n${data.code}`);
  console.log(`Reasoning: ${data.reasoning || '(none)'}`);
  console.groupEnd();

  console.group("%c[EVIDENCE]", "font-weight:bold");
  console.log("Extracted AST, execution, and reasoning indicators.");
  console.groupEnd();

  console.group("%c[FEATURES]", "font-weight:bold");
  if (data.features) {
    const ev = Object.entries(data.features).filter(([_, v]) => v).map(([k]) => ({ Feature: k }));
    if (ev.length) {
      console.table(ev);
    } else {
      console.log("No significant evidence extracted.");
    }
  }
  console.groupEnd();

  console.group("%c[MODEL]", "font-weight:bold");
  console.log("Model: NaiveBayes · misconception_model_v1");
  console.groupEnd();

  console.group("%c[CANDIDATES]", "font-weight:bold");
  if (data.modelPrediction?.probabilities) {
    const sorted = Object.entries(data.modelPrediction.probabilities)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .map(([m, p], idx) => ({ Misconception: m, Score: (p as number).toFixed(4), Rank: idx + 1 }));
    console.table(sorted);
  }
  console.groupEnd();
  
  if (data.modelPrediction?.prediction) {
    console.group(`%c[TOP PREDICTION]`, "font-weight:bold");
    console.log(`Candidate: ${data.modelPrediction.prediction}`);
    console.log(`Score: ${(data.modelPrediction.probabilities[data.modelPrediction.prediction] || 0).toFixed(4)}`);
    console.groupEnd();
  }

  console.group("%c[DIFFERENTIAL DIAGNOSIS]", "font-weight:bold");
  console.log(`Candidate: ${data.diagnosis?.candidateId || 'None'}`);
  console.log(`Status: ${data.diagnosis?.status}`);
  console.log(`Decision: ${data.diagnosis?.explanation || 'N/A'}`);
  console.groupEnd();

  console.group("%c[INTERVENTION]", "font-weight:bold");
  if (data.intervention) {
    console.log(`Intervention Type: DIRECT_EXPLANATION`);
    console.log(`Target: ${data.diagnosis?.candidateId || "M02"}`);
    console.log(`Explanation Source: Extracted from intervention engine rules`);
  } else {
    console.log("No intervention delivered.");
  }
  console.groupEnd();
  
  console.groupEnd();
}

function printJudgeTraceReassessment(data: any) {
  if (!data.isJudgeTrace) return;

  console.groupCollapsed(`%c[REASSESSMENT] - ${data.type}`, "font-weight:bold; color:#10b981;");
  console.log(`Event Type: ${data.evalEvent?.type}`);
  console.log(`Direct/Transfer Result: ${data.evalEvent?.result?.isCorrect ? 'Correct' : 'Incorrect'}`);
  console.log(`Reasoning Result: ${data.evalEvent?.result?.hasMisconceptionReasoning ? 'Misconception Persists' : 'Misconception Resolved'}`);
  console.groupEnd();

  console.groupCollapsed("%c[RESOLUTION]", "font-weight:bold; color:#f59e0b;");
  console.log(`Previous State: ${data.oldState?.status}`);
  console.log(`Event: ${data.evalEvent?.type}`);
  console.log(`New State: ${data.newState?.status}`);
  console.log(`Simulated Retention Pending: ${data.newState?.status === 'LIKELY_RESOLVED' ? 'Yes' : 'No'}`);
  console.groupEnd();
}

export default function ReassessmentUI() {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0].id);
  const [code, setCode] = useState(SCENARIOS[0].code);
  const [reasoning, setReasoning] = useState(SCENARIOS[0].reasoning);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [learnerState, setLearnerState] = useState<MisconceptionState>(createInitialState("M02"));
  const [extractedFeatures, setExtractedFeatures] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [intervention, setIntervention] = useState<any>(null);
  const [questionPhase, setQuestionPhase] = useState<"INITIAL" | "REASSESS_DIRECT" | "REASSESS_TRANSFER">("INITIAL");
  
  const [showUnderTheHood, setShowUnderTheHood] = useState(false);
  
  const [visualStage, setVisualStage] = useState<"INTRO" | "ATTEMPT" | "ANALYZING" | "EVIDENCE_DIAGNOSIS" | "INTERVENTION" | "REASSESS_DIRECT" | "REASSESS_TRANSFER" | "RESOLUTION">("INTRO");
  
  const [reassessDirectCode, setReassessDirectCode] = useState(`days = ["Monday", "Tuesday", "Wednesday"]\nprint(days[1])`);
  const [reassessDirectReasoning, setReassessDirectReasoning] = useState(`first item is index 0`);
  const [reassessTransferCode, setReassessTransferCode] = useState(`letters = ["A", "B", "C"]\nprint(letters[0])`);
  const [reassessTransferReasoning, setReassessTransferReasoning] = useState(`index 0 is first`);
  
  const [isJudgeTrace, setIsJudgeTrace] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_JUDGE_TRACE === 'true' || (typeof window !== 'undefined' && (window as any).JUDGE_TRACE)) {
      setIsJudgeTrace(true);
    }
  }, []);

  useEffect(() => {
    const scenario = SCENARIOS.find(s => s.id === selectedScenario);
    if (scenario) {
      setCode(scenario.code);
      setReasoning(scenario.reasoning);
      handleReset();
      
      if (scenario.id === "transfer_failure") {
        setReassessDirectCode(`days = ["Monday", "Tuesday", "Wednesday"]\nprint(days[0])`);
        setReassessDirectReasoning(`0 is the first index`);
        setReassessTransferCode(`letters = ["A", "B", "C"]\nprint(letters[1])`);
        setReassessTransferReasoning(`A is 1`);
      } else if (scenario.id === "basic_m02") {
        setReassessDirectCode(`days = ["Monday", "Tuesday", "Wednesday"]\nprint(days[0])`);
        setReassessDirectReasoning(`I used 0`);
        setReassessTransferCode(`letters = ["A", "B", "C"]\nprint(letters[0])`);
        setReassessTransferReasoning(`0`);
      } else {
        setReassessDirectCode(`days = ["Monday", "Tuesday", "Wednesday"]\nprint(days[0])`);
        setReassessDirectReasoning(`0 is the first index`);
        setReassessTransferCode(`letters = ["A", "B", "C"]\nprint(letters[0])`);
        setReassessTransferReasoning(`index 0`);
      }
    }
  }, [selectedScenario]);

  const handleReset = () => {
    setLearnerState(createInitialState("M02"));
    setExtractedFeatures(null);
    setDiagnosis(null);
    setIntervention(null);
    setQuestionPhase("INITIAL");
    setVisualStage("ATTEMPT");
    setIsAnalyzing(false);
  };

  const executeInitialAnalysis = async () => {
    setVisualStage("ANALYZING");
    setIsAnalyzing(true);
    
    await new Promise(r => setTimeout(r, 1200));

    const verifier = new PyodideWorkerCodeVerifier();
    let result: ExecutionResult;
    try {
      result = await verifier.verify({
        code: code,
        tests: [{ input: "", expectedOutput: M02_QUESTION.expectedBehavior.output || "" }],
        timeoutMs: 2000
      });
    } catch (e: any) {
      result = { status: "ERROR", stdout: "", stderr: e.message } as any;
    }
    const features = extractFeatures({ execution: result, reasoning, question: M02_QUESTION });
    setExtractedFeatures(features);

    const classifier = new NaiveBayesClassifier();
    const res = await fetch('/eval/misconception_model_v1.json');
    const data = await res.text();
    classifier.load(data);

    const diffDiagnosis = await runDifferentialDiagnosis({ features, model: classifier, question: M02_QUESTION });
    setDiagnosis(diffDiagnosis);

    const event: LearningEvent = {
      type: "DIAGNOSIS_MADE"
    };
    const newState = transitionMisconceptionState(learnerState, event);
    setLearnerState(newState);

    let finalIntervention = null;
    if (newState.status === "DIAGNOSED") {
      const engine = new InterventionEngine();
      finalIntervention = engine.getIntervention(diffDiagnosis.candidateId || "M02");
      setIntervention(finalIntervention);
    }
    
    let rawPrediction = null;
    if (isJudgeTrace) {
      rawPrediction = classifier.predict(features);
      printJudgeTraceInitial({
        isJudgeTrace,
        question: M02_QUESTION,
        code,
        reasoning,
        features,
        modelPrediction: rawPrediction,
        diagnosis: diffDiagnosis,
        intervention: finalIntervention
      });
    }
    
    setVisualStage("EVIDENCE_DIAGNOSIS");
    setIsAnalyzing(false);
  };

  const handleContinueToIntervention = () => {
    setVisualStage("INTERVENTION");
    const event: LearningEvent = { type: "INTERVENTION_DELIVERED" };
    setLearnerState(transitionMisconceptionState(learnerState, event));
  };

  const handleContinueToReassessmentDirect = () => {
    setVisualStage("REASSESS_DIRECT");
    setQuestionPhase("REASSESS_DIRECT");
  };

  const runReassessmentDirect = async () => {
    setVisualStage("ANALYZING");
    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 800));
    
    const verifier = new PyodideWorkerCodeVerifier();
    let result: ExecutionResult;
    try {
      result = await verifier.verify({
        code: reassessDirectCode,
        tests: [{ input: "", expectedOutput: M02_REASSESS_DIRECT.expectedBehavior.output || "" }],
        timeoutMs: 2000
      });
    } catch (e: any) {
      result = { status: "ERROR", stdout: "", stderr: e.message } as any;
    }

    const classifier = new NaiveBayesClassifier();
    const res = await fetch('/eval/misconception_model_v1.json');
    const data = await res.text();
    classifier.load(data);

    const evalEvent = await evaluateReassessment({
      execution: result,
      reasoning: reassessDirectReasoning,
      question: M02_REASSESS_DIRECT,
      model: classifier,
      targetMisconceptionId: "M02"
    });
    
    const newState = transitionMisconceptionState(learnerState, evalEvent);
    
    if (isJudgeTrace) {
      printJudgeTraceReassessment({
        isJudgeTrace,
        type: "DIRECT",
        evalEvent,
        oldState: learnerState,
        newState
      });
    }

    setLearnerState(newState);
    
    setVisualStage(newState.status === "PERSISTENT" ? "INTERVENTION" : "REASSESS_DIRECT");
    setIsAnalyzing(false);
  };

  const handleContinueToReassessmentTransfer = () => {
    setVisualStage("REASSESS_TRANSFER");
    setQuestionPhase("REASSESS_TRANSFER");
  };

  const runReassessmentTransfer = async () => {
    setVisualStage("ANALYZING");
    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 800));
    
    const verifier = new PyodideWorkerCodeVerifier();
    let result: ExecutionResult;
    try {
      result = await verifier.verify({
        code: reassessTransferCode,
        tests: [{ input: "", expectedOutput: M02_REASSESS_TRANSFER.expectedBehavior.output || "" }],
        timeoutMs: 2000
      });
    } catch (e: any) {
      result = { status: "ERROR", stdout: "", stderr: e.message } as any;
    }

    const classifier = new NaiveBayesClassifier();
    const res = await fetch('/eval/misconception_model_v1.json');
    const data = await res.text();
    classifier.load(data);

    const evalEvent = await evaluateReassessment({
      execution: result,
      reasoning: reassessTransferReasoning,
      question: M02_REASSESS_TRANSFER,
      model: classifier,
      targetMisconceptionId: "M02"
    });
    
    const newState = transitionMisconceptionState(learnerState, evalEvent);
    
    if (isJudgeTrace) {
      printJudgeTraceReassessment({
        isJudgeTrace,
        type: "TRANSFER",
        evalEvent,
        oldState: learnerState,
        newState
      });
    }

    setLearnerState(newState);
    
    setVisualStage("RESOLUTION");
    setIsAnalyzing(false);
  };

  const stages = [
    { num: "01", label: "Evidence", active: ["ANALYZING", "EVIDENCE_DIAGNOSIS"].includes(visualStage) || ["DIAGNOSED", "INTERVENTION", "IMPROVING", "LIKELY_RESOLVED", "VERIFIED_RESOLVED"].includes(learnerState.status) },
    { num: "02", label: "Diagnosis", active: ["EVIDENCE_DIAGNOSIS"].includes(visualStage) || ["DIAGNOSED", "INTERVENTION", "IMPROVING", "LIKELY_RESOLVED", "VERIFIED_RESOLVED"].includes(learnerState.status) },
    { num: "03", label: "Intervention", active: visualStage === "INTERVENTION" || ["INTERVENTION", "IMPROVING", "LIKELY_RESOLVED", "VERIFIED_RESOLVED"].includes(learnerState.status) },
    { num: "04", label: "Reassessment", active: ["REASSESS_DIRECT", "REASSESS_TRANSFER", "RESOLUTION"].includes(visualStage) || ["IMPROVING", "LIKELY_RESOLVED", "VERIFIED_RESOLVED"].includes(learnerState.status) },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-[1400px] h-full sm:h-[90vh] bg-[#0B0B0F] rounded-[32px] border border-white/10 flex flex-col sm:flex-row overflow-hidden shadow-2xl relative">
        
        <div className="absolute top-0 left-0 w-full flex justify-between items-center p-6 z-20 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]">R</div>
            <div>
              <h1 className="font-bold tracking-widest text-white leading-none">RE:LEARN</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Misconception-aware learning</p>
            </div>
          </div>
          <div className="pointer-events-auto flex gap-4 items-center">
            {isJudgeTrace && (
              <span className="px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                Judge Trace: ON
              </span>
            )}
            <span className="px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
              Demo Mode
            </span>
            <button onClick={handleReset} className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        <div className="w-full sm:w-[400px] lg:w-[460px] flex-shrink-0 bg-[#0A0514] p-10 flex flex-col justify-center relative border-b sm:border-b-0 sm:border-r border-white/5 z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-violet-900/40 via-purple-900/10 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10 mt-16 sm:mt-0">
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-2">
              Don't just check<br/>the answer.
            </h2>
            <h3 className="text-2xl font-semibold text-violet-300 mb-6">
              Understand the learner.
            </h3>
            
            <p className="text-slate-400 text-sm leading-relaxed mb-12 max-w-[90%]">
              Re:Learn detects misconceptions hidden behind answers, teaches to the underlying concept, and verifies learning through reassessment.
            </p>

            <div className="space-y-3">
              {stages.map((stage, idx) => (
                <div key={idx} className={`px-5 py-4 rounded-[18px] border transition-all duration-500 flex items-center gap-4 ${stage.active ? 'bg-white/5 border-white/10 shadow-[0_0_20px_rgba(139,92,246,0.05)]' : 'bg-transparent border-transparent opacity-40'}`}>
                  <span className={`text-xs font-bold ${stage.active ? 'text-violet-400' : 'text-slate-500'}`}>{stage.num}</span>
                  <span className={`text-sm font-semibold ${stage.active ? 'text-white' : 'text-slate-400'}`}>{stage.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[#0B0B0F] overflow-y-auto relative p-6 sm:p-12 sm:pt-28 pb-32 scrollbar-hide">
          <div className="max-w-3xl mx-auto space-y-8">
            
            <AnimatePresence mode="wait">
              {visualStage === "INTRO" && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 text-center"
                >
                  <div className="space-y-6 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-4">
                      <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></span>
                      Interactive Demo
                    </div>
                    <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight">
                      Don't just mark it wrong. <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-600">Fix the misconception.</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
                      Experience how Re:Learn goes beyond simple right or wrong answers to diagnose exactly <em>why</em> a learner made a mistake.
                    </p>
                  </div>
                  
                  <div className="bg-[#12121A] border border-white/5 rounded-[24px] p-6 max-w-xl w-full text-left flex gap-6 items-center shadow-xl">
                    <div className="w-16 h-16 rounded-full bg-violet-900/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <Code2 className="w-8 h-8 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">Intro to Python: Lists</h3>
                      <p className="text-slate-400 text-sm">Test your knowledge of Python list indexing and see how Re:Learn adapts to your specific answers.</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setVisualStage("ATTEMPT")}
                    className="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-4 px-12 rounded-[16px] transition-colors shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] flex items-center gap-2 text-lg group"
                  >
                    Start Interactive Demo
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              )}

              {visualStage === "ATTEMPT" && (
                <motion.div
                  key="attempt"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Learner Attempt</h2>
                    <div className="text-[10px] text-violet-400 uppercase tracking-widest border border-violet-500/20 bg-violet-500/5 inline-block px-2 py-0.5 rounded">Python · Introductory Programming</div>
                  </div>

                  <div className="bg-[#12121A] rounded-[24px] border border-white/5 p-6 space-y-6">
                    <div className="space-y-2">
                      <p className="text-white font-medium text-lg leading-relaxed">
                        What is the correct way to print the very first item from this list?
                      </p>
                      <div className="bg-[#050505] rounded-[12px] p-4 border border-white/5 font-mono text-sm text-slate-300">
                        items = ["apple", "banana", "cherry"]
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2 block">Select your answer:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { val: 'print(items[0])', label: 'print(items[0])' },
                          { val: 'print(items[1])', label: 'print(items[1])' },
                          { val: 'print(items["first"])', label: 'print(items["first"])' },
                          { val: 'print(items[-1])', label: 'print(items[-1])' }
                        ].map(opt => (
                          <button
                            key={opt.val}
                            onClick={() => setCode(`items = ["apple", "banana", "cherry"]\n${opt.val}`)}
                            className={`text-left p-4 rounded-[16px] border transition-all ${code.includes(opt.val) ? 'bg-[#1A1A24] border-violet-500/50 shadow-[0_0_15px_rgba(124,58,237,0.15)]' : 'bg-[#050505] border-white/5 hover:border-white/20'}`}
                          >
                            <div className="font-mono text-sm text-slate-200">{opt.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    


                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Student Reasoning</label>
                      <div className="bg-[#050505] rounded-[16px] border border-white/5 text-sm text-slate-300 overflow-hidden">
                        <input 
                          type="text"
                          value={reasoning}
                          onChange={(e) => setReasoning(e.target.value)}
                          placeholder="Explain your thought process (optional)..."
                          className="w-full bg-transparent p-4 outline-none"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={executeInitialAnalysis}
                      className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-4 rounded-[16px] transition-colors shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                    >
                      Analyze Attempt
                    </button>
                  </div>


                </motion.div>
              )}

              {visualStage === "ANALYZING" && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-64 space-y-6"
                >
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-2 border-purple-500/20 border-b-purple-500 animate-spin-slow"></div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-bold tracking-widest uppercase text-violet-400 text-sm">Analyzing</h3>
                    <p className="text-xs text-slate-500">Extracting features and running diagnosis...</p>
                  </div>
                </motion.div>
              )}

              {visualStage === "EVIDENCE_DIAGNOSIS" && (
                <motion.div
                  key="diagnosis"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Re:Learn Analysis</div>

                  {learnerState.status === "UNKNOWN" ? (
                    <div className="bg-[#12121A] border border-orange-500/20 rounded-[24px] p-8 text-center space-y-4 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500"></div>
                      <ShieldCheck className="w-12 h-12 text-orange-400 mx-auto" />
                      <h3 className="text-xl font-bold text-white">Insufficient Evidence</h3>
                      <p className="text-slate-400 text-sm max-w-md mx-auto">Re:Learn refuses to guess. The learner did not provide enough reasoning to confidently diagnose a conceptual error.</p>
                      
                      <div className="mt-8 pt-6 border-t border-white/5 text-left bg-black/20 p-6 rounded-[16px]">
                        <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">Extracted Features</h4>
                        <ul className="space-y-2 text-sm">
                           {extractedFeatures && Object.entries(extractedFeatures).map(([k, v]) => v ? (
                             <li key={k} className="flex items-center gap-2 text-slate-300">
                               <CheckCircle2 className="w-4 h-4 text-green-500" /> {k.replace(/_/g, ' ')}
                             </li>
                           ) : null)}
                        </ul>
                      </div>
                      
                      <button 
                        onClick={handleReset}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-4 rounded-[16px] transition-colors mt-6"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="bg-[#12121A] rounded-[24px] border border-white/5 p-6">
                        <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">Observed Evidence</h3>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {extractedFeatures && Object.entries(extractedFeatures).map(([k, v]) => v ? (
                            <li key={k} className="flex items-center gap-3 text-sm bg-black/20 px-4 py-3 rounded-[12px] border border-white/5">
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-slate-300 capitalize">{k.replace(/_/g, ' ')}</span>
                            </li>
                          ) : null)}
                        </ul>
                      </div>

                      <div className="bg-gradient-to-br from-violet-900/20 to-[#12121A] rounded-[24px] border border-violet-500/20 p-8 relative overflow-hidden shadow-[0_10px_40px_rgba(124,58,237,0.1)]">
                        <div className="absolute top-0 right-0 p-6">
                           <span className="px-3 py-1 bg-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-widest rounded-full border border-violet-500/30">Evidence-Backed</span>
                        </div>
                        
                        <h2 className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-2">Re:Learn Found Something</h2>
                        <div className="flex items-baseline gap-4 mb-4">
                          <h3 className="text-4xl font-bold text-white">{diagnosis?.candidateId || "M02"}</h3>
                        </div>
                        <p className="text-lg text-slate-200 font-medium max-w-lg mb-8">
                          {diagnosis?.candidateId === "M02" ? "The learner incorrectly believes that Python lists use 1-based indexing." : "The learner's mental model contradicts the expected concept."}
                        </p>

                        <div className="bg-black/30 rounded-[16px] p-5 border border-white/5 space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Why this matters</p>
                          <p className="text-sm text-slate-300">The answer alone does not tell us whether the learner understands the concept.</p>
                          <p className="text-base font-bold text-white pt-2 border-t border-white/5 mt-2">Correct answer ≠ Correct understanding</p>
                        </div>
                      </div>

                      <div className="bg-[#12121A] rounded-[24px] border border-white/5 p-6 relative mt-6">
                        <div className="absolute -top-3 left-6 px-2 bg-[#12121A] text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1">
                          <Brain className="w-3 h-3" /> AI Teacher
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed mt-2">
                          {intervention || "Python uses zero-based indexing. The first item is at index 0, the second at index 1, and the third at index 2."}
                        </p>
                        <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-4">Explanation generated from structured diagnosis</p>
                      </div>

                      <button 
                        onClick={handleContinueToIntervention}
                        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-4 rounded-[16px] transition-colors shadow-[0_0_20px_rgba(124,58,237,0.2)] mt-8"
                      >
                        Provide Targeted Intervention
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              {visualStage === "INTERVENTION" && (
                <motion.div
                  key="intervention"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Targeted Lesson</div>
                  
                  <div className="bg-[#12121A] rounded-[24px] border border-white/5 p-8 text-center space-y-8">
                    {learnerState.status === "PERSISTENT" && (
                      <div className="bg-orange-500/10 border border-orange-500/30 text-orange-400 p-4 rounded-xl text-sm font-semibold mb-4">
                        Oops! You made the same mistake again. Let's review the concept.
                      </div>
                    )}
                    <h2 className="text-2xl font-bold text-white">Let's fix this</h2>
                    
                    <div className="flex justify-center gap-4 text-lg font-mono bg-black/30 p-6 rounded-[16px] inline-flex border border-white/5">
                      <div className="text-slate-400 flex flex-col items-center">
                        <span className="text-xs uppercase tracking-widest mb-2 font-sans font-bold text-slate-500">First</span>
                        <span className="text-white">0</span>
                      </div>
                      <div className="text-slate-600 flex flex-col items-center justify-end px-2">→</div>
                      <div className="text-slate-400 flex flex-col items-center">
                        <span className="text-xs uppercase tracking-widest mb-2 font-sans font-bold text-slate-500">Second</span>
                        <span className="text-white">1</span>
                      </div>
                      <div className="text-slate-600 flex flex-col items-center justify-end px-2">→</div>
                      <div className="text-slate-400 flex flex-col items-center">
                        <span className="text-xs uppercase tracking-widest mb-2 font-sans font-bold text-slate-500">Third</span>
                        <span className="text-white">2</span>
                      </div>
                    </div>

                    <div className="bg-violet-900/10 border border-violet-500/20 p-6 rounded-[16px] max-w-sm mx-auto space-y-4">
                      <p className="text-sm text-slate-200 font-medium">Where is 'banana'?</p>
                      <div className="flex justify-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-slate-700 flex items-center justify-center text-slate-400 text-sm">0</div>
                        <div className="w-10 h-10 rounded-full border-2 border-violet-500 bg-violet-500/20 flex items-center justify-center text-violet-300 font-bold text-sm shadow-[0_0_15px_rgba(124,58,237,0.3)]">1</div>
                        <div className="w-10 h-10 rounded-full border-2 border-slate-700 flex items-center justify-center text-slate-400 text-sm">2</div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleContinueToReassessmentDirect}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-4 rounded-[16px] transition-colors"
                  >
                    Continue to Reassessment
                  </button>
                </motion.div>
              )}

              {(visualStage === "REASSESS_DIRECT" || visualStage === "REASSESS_TRANSFER") && (
                <motion.div
                  key="reassessment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">New Challenge</div>

                  <div className="bg-[#12121A] rounded-[24px] border border-white/5 p-6 space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                      <h3 className="font-bold text-white">
                        {visualStage === "REASSESS_DIRECT" ? "Print the first day from the list" : "Print the first letter from the list"}
                      </h3>
                      <span className="px-3 py-1 bg-violet-500/10 text-violet-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-violet-500/20">
                        {visualStage === "REASSESS_DIRECT" ? "Direct Check" : "Transfer Check"}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="bg-[#050505] rounded-[12px] p-4 border border-white/5 font-mono text-sm text-slate-300">
                        {visualStage === "REASSESS_DIRECT" ? 'days = ["monday", "tuesday", "wednesday"]' : 'letters = ["a", "b", "c"]'}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2 block">Select your answer:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {visualStage === "REASSESS_DIRECT" ? [
                          { val: 'print(days[0])', label: 'print(days[0])' },
                          { val: 'print(days[1])', label: 'print(days[1])' }
                        ].map(opt => (
                          <button
                            key={opt.val}
                            onClick={() => setReassessDirectCode(`days = ["monday", "tuesday", "wednesday"]\n${opt.val}`)}
                            className={`text-left p-4 rounded-[16px] border transition-all ${reassessDirectCode.includes(opt.val) ? 'bg-[#1A1A24] border-violet-500/50 shadow-[0_0_15px_rgba(124,58,237,0.15)]' : 'bg-[#050505] border-white/5 hover:border-white/20'}`}
                          >
                            <div className="font-mono text-sm text-slate-200">{opt.label}</div>
                          </button>
                        )) : [
                          { val: 'print(letters[0])', label: 'print(letters[0])' },
                          { val: 'print(letters[1])', label: 'print(letters[1])' }
                        ].map(opt => (
                          <button
                            key={opt.val}
                            onClick={() => setReassessTransferCode(`letters = ["a", "b", "c"]\n${opt.val}`)}
                            className={`text-left p-4 rounded-[16px] border transition-all ${reassessTransferCode.includes(opt.val) ? 'bg-[#1A1A24] border-violet-500/50 shadow-[0_0_15px_rgba(124,58,237,0.15)]' : 'bg-[#050505] border-white/5 hover:border-white/20'}`}
                          >
                            <div className="font-mono text-sm text-slate-200">{opt.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 mt-6">
                      <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Why did you choose that?</label>
                      <div className="bg-[#050505] rounded-[16px] border border-white/5 text-sm text-slate-300 overflow-hidden">
                        <input 
                          type="text"
                          value={visualStage === "REASSESS_DIRECT" ? reassessDirectReasoning : reassessTransferReasoning}
                          onChange={(e) => visualStage === "REASSESS_DIRECT" ? setReassessDirectReasoning(e.target.value) : setReassessTransferReasoning(e.target.value)}
                          placeholder="Explain your thought process (optional)..."
                          className="w-full bg-transparent p-4 outline-none"
                        />
                      </div>
                    </div>
                    
                    <div className="bg-black/20 p-5 rounded-[16px] border border-white/5 grid grid-cols-3 gap-4">
                       <div className="text-center space-y-2">
                         <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Direct</div>
                         <div className="flex justify-center">
                           {visualStage === "REASSESS_TRANSFER" || learnerState.status === "VERIFIED_RESOLVED" ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-700"></div>}
                         </div>
                       </div>
                       <div className="text-center space-y-2">
                         <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Transfer</div>
                         <div className="flex justify-center">
                           {learnerState.status === "VERIFIED_RESOLVED" ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-700"></div>}
                         </div>
                       </div>
                       <div className="text-center space-y-2">
                         <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Reasoning</div>
                         <div className="flex justify-center">
                           {learnerState.status === "VERIFIED_RESOLVED" || visualStage === "REASSESS_TRANSFER" ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-700"></div>}
                         </div>
                       </div>
                    </div>

                    {!(learnerState.status === "IMPROVING" && visualStage === "REASSESS_DIRECT") && (
                      <button 
                        onClick={visualStage === "REASSESS_DIRECT" ? runReassessmentDirect : runReassessmentTransfer}
                        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-4 rounded-[16px] transition-colors"
                      >
                        Analyze {visualStage === "REASSESS_DIRECT" ? "Direct" : "Transfer"} Check
                      </button>
                    )}
                    
                    {learnerState.status === "IMPROVING" && visualStage === "REASSESS_DIRECT" && (
                      <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-[16px] p-6 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-emerald-400 font-bold text-lg">Great job!</h3>
                          <p className="text-slate-300 text-sm mt-1">You correctly applied the concept to a similar problem.</p>
                        </div>
                        <button 
                          onClick={handleContinueToReassessmentTransfer}
                          className="w-full bg-white hover:bg-slate-100 text-black font-semibold py-3 rounded-[12px] transition-colors mt-2"
                        >
                          Continue to Transfer Check
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {visualStage === "RESOLUTION" && (
                <motion.div
                  key="resolution"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Resolution State</div>
                  
                  {learnerState.status === "VERIFIED_RESOLVED" ? (
                    <div className="bg-gradient-to-br from-emerald-900/20 to-[#12121A] rounded-[24px] border border-emerald-500/20 p-10 text-center space-y-6 relative overflow-hidden shadow-[0_10px_40px_rgba(16,185,129,0.1)]">
                      <div className="absolute top-0 left-0 w-full flex justify-center pt-6">
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-500/30 flex items-center gap-2">
                          <Activity className="w-3 h-3" /> Simulated Retention Check
                        </span>
                      </div>
                      
                      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mt-8 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        <Check className="w-10 h-10 text-emerald-400" />
                      </div>
                      
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Verified Resolved</h2>
                        <p className="text-sm text-slate-300">Independent reassessment evidence supports resolution.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-orange-900/20 to-[#12121A] rounded-[24px] border border-orange-500/20 p-10 text-center space-y-6 relative overflow-hidden">
                      <div className="w-20 h-20 rounded-full bg-orange-500/10 border-2 border-orange-500/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                        <RotateCcw className="w-10 h-10 text-orange-400" />
                      </div>
                      
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Persistent Misconception</h2>
                        <p className="text-sm text-slate-300">The learner fell back to their original mental model on the transfer task.</p>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handleReset}
                    className="w-full bg-white hover:bg-slate-200 text-black font-semibold py-4 rounded-[16px] transition-colors shadow-xl"
                  >
                    Start New Demo
                  </button>
                </motion.div>
              )}

            </AnimatePresence>

            <div className="mt-16 pt-8 border-t border-white/5">
              <button 
                onClick={() => setShowUnderTheHood(!showUnderTheHood)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
              >
                <ChevronRight className={`w-4 h-4 transition-transform ${showUnderTheHood ? 'rotate-90' : ''}`} />
                Under the Hood
              </button>
              
              {showUnderTheHood && (
                <div className="mt-6 bg-[#12121A] rounded-[24px] border border-white/5 p-6 text-sm">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">1</div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-300">Learner Attempt</div>
                      </div>
                    </div>
                    <div className="w-0.5 h-4 bg-slate-800 ml-4"></div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">2</div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-300">Evidence Engine</div>
                      </div>
                    </div>
                    <div className="w-0.5 h-4 bg-slate-800 ml-4"></div>

                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">3</div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-300">Trained Misconception Model</div>
                        <div className="text-xs text-slate-500">Naive Bayes</div>
                      </div>
                    </div>
                    <div className="w-0.5 h-4 bg-slate-800 ml-4"></div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">4</div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-300">Differential Diagnosis</div>
                      </div>
                    </div>
                    <div className="w-0.5 h-4 bg-slate-800 ml-4"></div>

                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">5</div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-300">Groq Explanation</div>
                      </div>
                    </div>
                    <div className="w-0.5 h-4 bg-slate-800 ml-4"></div>

                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">6</div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-300">Resolution Engine</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5">
                    <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">Model Evaluation</h4>
                    <div className="bg-black/30 p-4 rounded-[16px] border border-white/5">
                      <p className="text-sm text-slate-400 mb-2">Held-out evaluation available</p>
                      <button className="text-violet-400 font-semibold text-sm hover:text-violet-300">View evaluation →</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
