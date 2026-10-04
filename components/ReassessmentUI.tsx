"use client";

import React, { useState, useEffect } from 'react';
import { M02_QUESTION } from '../data/questions/M02';
import { M02_REASSESS_DIRECT, M02_REASSESS_TRANSFER } from '../data/questions/M02_reassess';
import { PyodideWorkerCodeVerifier } from '../lib/execution/PyodideWorker';
import { ExecutionResult } from '../lib/execution/CodeVerifier';
import { extractFeatures } from '../lib/evidence/extractor';
import { runDifferentialDiagnosis } from '../lib/diagnosis/differential';
import { NaiveBayesClassifier } from '../lib/diagnosis/model/classifier';
import { InterventionEngine } from '../lib/intervention/engine';
import { evaluateReassessment } from '../lib/learner/reassessment';
import { ResolutionState, transitionMisconceptionState, createInitialState, MisconceptionState, LearningEvent } from '../lib/learner/resolution';
import { DEMO_MODE } from '../lib/db/client';

const SCENARIOS: Record<string, any> = {
  "M02": {
    name: "1. M02 — Misconception Detected",
    steps: {
      INITIAL: { code: "items = ['apple', 'banana', 'cherry']\n# Print the first item\nprint(items[1])", reasoning: "the first index is 1" },
      REASSESS_DIRECT: { code: "days = ['monday', 'tuesday', 'wednesday']\n# Print the first day\nprint(days[0])", reasoning: "I used 0" },
      REASSESS_TRANSFER: { code: "letters = ['a', 'b', 'c']\n# Print the first letter\nprint(letters[0])", reasoning: "0 is the first" }
    }
  },
  "TRAP": {
    name: "2. Correct Answer Trap",
    steps: {
      INITIAL: { code: "items = ['apple', 'banana', 'cherry']\n# Print the first item\nprint(items[0])", reasoning: "I got apple, the first index is 1" },
      REASSESS_DIRECT: { code: "days = ['monday', 'tuesday', 'wednesday']\n# Print the first day\nprint(days[1])", reasoning: "first index 1" },
      REASSESS_TRANSFER: { code: "letters = ['a', 'b', 'c']\n# Print the first letter\nprint(letters[1])", reasoning: "first index 1" }
    }
  },
  "ABSTAIN": {
    name: "3. Insufficient Evidence / ABSTAIN",
    steps: {
      INITIAL: { code: "items = ['apple', 'banana', 'cherry']\n# Print the first item\nprint(items[1])", reasoning: "" },
    }
  },
  "TRANSFER_FAIL": {
    name: "4. Transfer Failure",
    steps: {
      INITIAL: { code: "items = ['apple', 'banana', 'cherry']\n# Print the first item\nprint(items[1])", reasoning: "first is 1" },
      REASSESS_DIRECT: { code: "days = ['monday', 'tuesday', 'wednesday']\n# Print the first day\nprint(days[0])", reasoning: "use 0" },
      REASSESS_TRANSFER: { code: "letters = ['a', 'b', 'c']\n# Print the first letter\nprint(letters[1])", reasoning: "1 is first" }
    }
  },
  "VERIFIED": {
    name: "5. Verified Resolution",
    steps: {
      INITIAL: { code: "items = ['apple', 'banana', 'cherry']\n# Print the first item\nprint(items[1])", reasoning: "first is 1" },
      REASSESS_DIRECT: { code: "days = ['monday', 'tuesday', 'wednesday']\n# Print the first day\nprint(days[0])", reasoning: "zero indexed" },
      REASSESS_TRANSFER: { code: "letters = ['a', 'b', 'c']\n# Print the first letter\nprint(letters[0])", reasoning: "always starts at 0" }
    }
  }
};

export default function ReassessmentUI() {
  const [activeScenario, setActiveScenario] = useState("M02");
  
  const [code, setCode] = useState(SCENARIOS["M02"].steps.INITIAL.code);
  const [reasoning, setReasoning] = useState(SCENARIOS["M02"].steps.INITIAL.reasoning);
  const [learnerState, setLearnerState] = useState<MisconceptionState>(createInitialState("UNKNOWN"));
  
  const [interventionLevel, setInterventionLevel] = useState(1);
  const [interventionText, setInterventionText] = useState("");
  
  const [lastFeatures, setLastFeatures] = useState<string[]>([]);
  const [diagnosisData, setDiagnosisData] = useState<{ status: string, explanation: string, candidate: string } | null>(null);
  const [execResultData, setExecResultData] = useState<ExecutionResult | null>(null);
  
  const [questionPhase, setQuestionPhase] = useState<"INITIAL" | "REASSESS_DIRECT" | "REASSESS_TRANSFER">("INITIAL");
  
  const [model, setModel] = useState<NaiveBayesClassifier | null>(null);
  const [verifier, setVerifier] = useState<PyodideWorkerCodeVerifier | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const engine = new InterventionEngine();

  useEffect(() => {
    const init = async () => {
      const m = new NaiveBayesClassifier();
      const res = await fetch('/eval/misconception_model_v1.json');
      if (res.ok) {
        m.load(await res.text());
        setModel(m);
      }
      setVerifier(new PyodideWorkerCodeVerifier());
    };
    init();
  }, []);

  const resetState = (scenarioKey: string) => {
    setActiveScenario(scenarioKey);
    setQuestionPhase("INITIAL");
    setCode(SCENARIOS[scenarioKey].steps.INITIAL.code);
    setReasoning(SCENARIOS[scenarioKey].steps.INITIAL.reasoning);
    setLearnerState(createInitialState("UNKNOWN"));
    setInterventionLevel(1);
    setInterventionText("");
    setLastFeatures([]);
    setDiagnosisData(null);
    setExecResultData(null);
  };

  const handleStateChange = (event: LearningEvent) => {
    const newState = transitionMisconceptionState(learnerState, event);
    setLearnerState(newState);
    return newState;
  };

  const handleRun = async () => {
    if (!verifier || !model || isEvaluating) return;
    setIsEvaluating(true);
    setExecResultData(null);

    try {
      const currentQ = questionPhase === "INITIAL" ? M02_QUESTION 
                     : questionPhase === "REASSESS_DIRECT" ? M02_REASSESS_DIRECT 
                     : M02_REASSESS_TRANSFER;

      const execResult = await verifier.verify({ code, tests: [], timeoutMs: 3000 });
      setExecResultData(execResult);

      if (learnerState.status === "UNKNOWN" || learnerState.status === "SUSPECTED") {
        const features = extractFeatures({ execution: execResult, reasoning, question: currentQ });
        setLastFeatures(Object.keys(features).filter(k => features[k] === 1));
        
        const diagnosis = await runDifferentialDiagnosis({ features, model, question: currentQ });
        setDiagnosisData({ status: diagnosis.status, explanation: diagnosis.explanation, candidate: diagnosis.candidateId || "None" });

        if (diagnosis.status === "DIAGNOSED") {
          let s = handleStateChange({ type: "DIAGNOSIS_MADE", evidenceStrength: "HIGH" });
          
          setTimeout(() => {
            s = handleStateChange({ type: "INTERVENTION_DELIVERED" });
            const text = engine.getIntervention(diagnosis.candidateId!, interventionLevel);
            setInterventionText(text);
            
            setQuestionPhase("REASSESS_DIRECT");
            const nextStep = SCENARIOS[activeScenario].steps.REASSESS_DIRECT;
            if (nextStep) {
              setCode(nextStep.code);
              setReasoning(nextStep.reasoning);
            } else {
              setCode("days = ['monday', 'tuesday', 'wednesday']\n# Print the first day\nprint(days[?])");
              setReasoning("");
            }
          }, 1500);
        }
      } else if (learnerState.status === "INTERVENTION" || learnerState.status === "PERSISTENT" || learnerState.status === "IMPROVING") {
        const event = await evaluateReassessment({
          execution: execResult,
          reasoning,
          question: currentQ,
          model,
          targetMisconceptionId: learnerState.misconceptionId || "M02"
        });

        // Re-extract features just for display
        const features = extractFeatures({ execution: execResult, reasoning, question: currentQ });
        setLastFeatures(Object.keys(features).filter(k => features[k] === 1));
        
        const newState = handleStateChange(event as LearningEvent);

        if (newState.status === "PERSISTENT") {
          setInterventionLevel(prev => Math.min(prev + 1, 4));
          const text = engine.getIntervention("M02", Math.min(interventionLevel + 1, 4));
          setInterventionText(text);
          setDiagnosisData(prev => prev ? { ...prev, explanation: "Misconception remains persistent despite correct output or due to errors." } : null);
        } else {
          if (newState.status === "IMPROVING") {
            setQuestionPhase("REASSESS_TRANSFER");
            const nextStep = SCENARIOS[activeScenario].steps.REASSESS_TRANSFER;
            if (nextStep) {
              setCode(nextStep.code);
              setReasoning(nextStep.reasoning);
            } else {
              setCode("letters = ['a', 'b', 'c']\n# Print the first letter\nprint(letters[?])");
              setReasoning("");
            }
          }
        }
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const currentQ = questionPhase === "INITIAL" ? M02_QUESTION 
                 : questionPhase === "REASSESS_DIRECT" ? M02_REASSESS_DIRECT 
                 : M02_REASSESS_TRANSFER;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* HEADER */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">RE:LEARN</h1>
        <p className="text-slate-500 font-medium mt-1">AI Misconception-Aware Programming Tutor</p>
      </div>

      {/* DEMO CONTROLS */}
      <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 flex items-center gap-4">
        <div className="font-bold text-slate-700 bg-slate-200 px-2 py-1 rounded text-xs tracking-wider">DEMO MODE</div>
        <select 
          className="border border-slate-300 rounded p-2 text-sm flex-1 font-medium bg-white"
          value={activeScenario}
          onChange={(e) => resetState(e.target.value)}
        >
          {Object.entries(SCENARIOS).map(([k, v]) => (
            <option key={k} value={k}>{v.name}</option>
          ))}
        </select>
        <button onClick={() => resetState(activeScenario)} className="px-4 py-2 bg-white border border-slate-300 rounded text-sm hover:bg-slate-50 transition-colors">
          Reset Scenario
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: LEARNER INTERFACE */}
        <div className="space-y-6">
          
          {/* Phase Indicator */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${questionPhase === 'INITIAL' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              INITIAL CHECK
            </span>
            <div className="w-4 h-[2px] bg-slate-300" />
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${questionPhase === 'REASSESS_DIRECT' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              DIRECT CHECK
            </span>
            <div className="w-4 h-[2px] bg-slate-300" />
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${questionPhase === 'REASSESS_TRANSFER' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              TRANSFER CHECK
            </span>
          </div>

          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b px-4 py-3">
              <h3 className="font-semibold text-slate-800">Prompt</h3>
              <p className="text-sm text-slate-600 mt-1">Please write code for the following task.</p>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Python Code</label>
                <textarea 
                  value={code} 
                  onChange={e => setCode(e.target.value)} 
                  className="w-full h-32 font-mono text-sm p-3 border rounded-lg bg-slate-900 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  spellCheck={false}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Your Reasoning (Optional)</label>
                <input 
                  type="text" 
                  value={reasoning} 
                  onChange={e => setReasoning(e.target.value)} 
                  placeholder="Explain your thought process..."
                  className="w-full p-3 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button 
                onClick={handleRun}
                disabled={isEvaluating}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isEvaluating ? "Evaluating..." : "Run & Submit"}
              </button>
            </div>
          </div>

          {/* Execution Output */}
          {execResultData && (
            <div className={`p-4 rounded-lg border ${execResultData.status === 'SUCCESS' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${execResultData.status === 'SUCCESS' ? 'text-emerald-800' : 'text-red-800'}`}>
                Execution {execResultData.status}
              </h4>
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {execResultData.status === 'SUCCESS' ? execResultData.stdout || '(no output)' : execResultData.stderr || execResultData.errorType}
              </pre>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: RE:LEARN SYSTEM */}
        <div className="space-y-6">
          
          {/* Resolution State */}
          <div className="bg-white border rounded-xl shadow-sm p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Resolution State</h3>
            <div className="flex flex-wrap gap-2">
              {["UNKNOWN", "DIAGNOSED", "INTERVENTION", "PERSISTENT", "IMPROVING", "LIKELY_RESOLVED", "VERIFIED_RESOLVED"].map(s => (
                <span key={s} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${learnerState.status === s ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-slate-100 text-slate-400'}`}>
                  {s}
                </span>
              ))}
            </div>
            {learnerState.status === "VERIFIED_RESOLVED" && (
              <div className="mt-4 p-3 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium flex gap-4">
                <span>✓ Direct</span>
                <span>✓ Transfer</span>
                <span>✓ Reasoning</span>
              </div>
            )}
          </div>

          {/* Evidence Card */}
          {lastFeatures.length > 0 && (
            <div className="bg-white border rounded-xl shadow-sm p-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Observed Evidence</h3>
              <ul className="space-y-2">
                {lastFeatures.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm font-mono text-slate-700 bg-slate-50 px-3 py-2 rounded border border-slate-100">
                    <span className="text-indigo-500">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Diagnosis Card */}
          {diagnosisData && (
            <div className={`bg-white border rounded-xl shadow-sm overflow-hidden ${diagnosisData.status === 'DIAGNOSED' ? 'border-amber-300' : 'border-slate-200'}`}>
              <div className={`px-5 py-3 border-b ${diagnosisData.status === 'DIAGNOSED' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${diagnosisData.status === 'DIAGNOSED' ? 'text-amber-800' : 'text-slate-500'}`}>
                  Differential Diagnosis
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {diagnosisData.status === 'ABSTAIN' ? (
                  <div>
                    <div className="text-lg font-bold text-slate-700">Insufficient evidence</div>
                    <p className="text-sm text-slate-600 mt-2">Re:Learn will not guess the learner's misconception.</p>
                    <p className="text-sm text-slate-500 mt-1 italic border-l-2 border-slate-300 pl-3">{diagnosisData.explanation}</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-semibold text-slate-500">Possible misconception:</div>
                    <div className="text-xl font-bold text-amber-600 mt-1">{diagnosisData.candidate}</div>
                    
                    <div className="mt-4">
                      <div className="text-xs font-bold text-slate-500 uppercase">Why</div>
                      <p className="text-sm text-slate-700 mt-1">{diagnosisData.explanation}</p>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                      <span>Model: NaiveBayes (Production)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Intervention Card */}
          {(learnerState.status === "INTERVENTION" || learnerState.status === "PERSISTENT" || learnerState.status === "IMPROVING" || learnerState.status === "LIKELY_RESOLVED") && interventionText && (
            <div className="bg-white border border-indigo-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100 flex justify-between items-center">
                <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                  Targeted Intervention
                </h3>
                <span className="text-xs font-bold text-indigo-500 bg-indigo-100 px-2 py-1 rounded">Level {interventionLevel}</span>
              </div>
              <div className="p-5">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{interventionText}</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
