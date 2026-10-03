"use client";

import React, { useState, useEffect } from 'react';
import { M02_QUESTION } from '../data/questions/M02';
import { M02_REASSESS_DIRECT, M02_REASSESS_TRANSFER } from '../data/questions/M02_reassess';
import { PyodideWorkerCodeVerifier } from '../lib/execution/PyodideWorker';
import { extractFeatures } from '../lib/evidence/extractor';
import { runDifferentialDiagnosis } from '../lib/diagnosis/differential';
import { NaiveBayesClassifier } from '../lib/diagnosis/model/classifier';
import { InterventionEngine } from '../lib/intervention/engine';
import { evaluateReassessment } from '../lib/learner/reassessment';
import { ResolutionState, transitionMisconceptionState, createInitialState, MisconceptionState, LearningEvent } from '../lib/learner/resolution';
import { loadLearnerState, saveLearnerState, DEMO_MODE, persistAttempt, persistDiagnosis, persistEvidence, persistIntervention } from '../lib/db/client';

export default function ReassessmentUI() {
  const [code, setCode] = useState("items = ['apple', 'banana', 'cherry']\n# Print the first item\nprint(items[1])");
  const [reasoning, setReasoning] = useState("");
  const [learnerState, setLearnerState] = useState<MisconceptionState>(createInitialState("M02"));
  const [interventionLevel, setInterventionLevel] = useState(1);
  const [interventionText, setInterventionText] = useState("");
  const [diagnosisMsg, setDiagnosisMsg] = useState("");
  const [questionPhase, setQuestionPhase] = useState<"INITIAL" | "REASSESS_DIRECT" | "REASSESS_TRANSFER">("INITIAL");
  
  const [model, setModel] = useState<NaiveBayesClassifier | null>(null);
  const [verifier, setVerifier] = useState<PyodideWorkerCodeVerifier | null>(null);
  const engine = new InterventionEngine();
  const learnerId = "demo_learner_123";

  useEffect(() => {
    const init = async () => {
      // Mock loading model
      const m = new NaiveBayesClassifier();
      const res = await fetch('/eval/misconception_model_v1.json');
      if (res.ok) {
        m.load(await res.text());
        setModel(m);
      }
      setVerifier(new PyodideWorkerCodeVerifier());

      const savedState = await loadLearnerState(learnerId, "M02");
      if (savedState) {
        setLearnerState(savedState);
        if (savedState.status === "INTERVENTION" || savedState.status === "PERSISTENT") {
          setQuestionPhase("REASSESS_DIRECT");
          setCode("days = ['monday', 'tuesday', 'wednesday']\n# Print the first day\nprint(days[?])");
          setInterventionText(engine.getIntervention("M02", 1));
        } else if (savedState.status === "IMPROVING") {
          setQuestionPhase("REASSESS_TRANSFER");
          setCode("letters = ['a', 'b', 'c']\n# Print the first letter\nprint(letters[?])");
        }
      }
    };
    init();
  }, []);

  const handleStateChange = async (event: LearningEvent) => {
    const newState = transitionMisconceptionState(learnerState, event);
    setLearnerState(newState);
    await saveLearnerState(learnerId, newState);
    return newState;
  };

  const handleRun = async () => {
    if (!verifier || !model) return;

    const currentQ = questionPhase === "INITIAL" ? M02_QUESTION 
                   : questionPhase === "REASSESS_DIRECT" ? M02_REASSESS_DIRECT 
                   : M02_REASSESS_TRANSFER;

    const execResult = await verifier.verify({ code, tests: [], timeoutMs: 3000 });
    await persistAttempt({ learnerId, questionId: currentQ.id, code, reasoning, execResult });

    if (learnerState.status === "UNKNOWN" || learnerState.status === "SUSPECTED") {
      const features = extractFeatures({ execution: execResult, reasoning, question: currentQ });
      await persistEvidence({ learnerId, questionId: currentQ.id, features });
      
      const diagnosis = await runDifferentialDiagnosis({ features, model, question: currentQ });
      await persistDiagnosis({ learnerId, questionId: currentQ.id, diagnosis });

      if (diagnosis.status === "DIAGNOSED") {
        await handleStateChange({ type: "DIAGNOSIS_MADE", evidenceStrength: diagnosis.confidence > 0.9 ? "HIGH" : "MODERATE" });
        setDiagnosisMsg(diagnosis.explanation);
        
        // Auto-transition to intervention
        setTimeout(async () => {
          await handleStateChange({ type: "INTERVENTION_DELIVERED" });
          const text = engine.getIntervention(diagnosis.candidateId!, interventionLevel);
          setInterventionText(text);
          await persistIntervention({ learnerId, targetMisconceptionId: diagnosis.candidateId, level: interventionLevel, text });
          
          setQuestionPhase("REASSESS_DIRECT");
          setCode("days = ['monday', 'tuesday', 'wednesday']\n# Print the first day\nprint(days[?])");
          setReasoning("");
        }, 1500);
      } else {
        setDiagnosisMsg("Evidence insufficient: " + diagnosis.explanation);
      }
    } else if (learnerState.status === "INTERVENTION" || learnerState.status === "PERSISTENT" || learnerState.status === "IMPROVING") {
      const event = await evaluateReassessment({
        execution: execResult,
        reasoning,
        question: currentQ,
        model,
        targetMisconceptionId: "M02"
      });

      const newState = await handleStateChange(event as LearningEvent);

      if (newState.status === "PERSISTENT") {
        setInterventionLevel(prev => Math.min(prev + 1, 4));
        const text = engine.getIntervention("M02", Math.min(interventionLevel + 1, 4));
        setInterventionText(text);
        await persistIntervention({ learnerId, targetMisconceptionId: "M02", level: Math.min(interventionLevel + 1, 4), text });
      } else {
        if (newState.status === "IMPROVING") {
          setQuestionPhase("REASSESS_TRANSFER");
          setCode("letters = ['a', 'b', 'c']\n# Print the first letter\nprint(letters[?])");
          setReasoning("");
        } else if (newState.status === "VERIFIED_RESOLVED" || newState.status === "LIKELY_RESOLVED") {
          setDiagnosisMsg(`Great job! Status: ${newState.status}`);
        }
      }
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Re:Learn - M02 Pipeline</h1>
      
      <div className="flex gap-4 items-center">
        <div className="font-semibold">State:</div>
        <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">{learnerState.status}</div>
      </div>

      <div className="space-y-2">
        <label className="font-semibold block">Question: {questionPhase}</label>
        <textarea 
          value={code} 
          onChange={e => setCode(e.target.value)} 
          className="w-full h-32 font-mono p-4 border rounded bg-slate-50"
        />
      </div>

      <div className="space-y-2">
        <label className="font-semibold block">Your Reasoning (Optional)</label>
        <input 
          type="text" 
          value={reasoning} 
          onChange={e => setReasoning(e.target.value)} 
          placeholder="Why did you write this code?"
          className="w-full p-2 border rounded"
        />
      </div>

      <button 
        onClick={handleRun}
        className="px-4 py-2 bg-black text-white rounded font-semibold hover:bg-gray-800"
      >
        Run & Evaluate
      </button>

      {diagnosisMsg && (
        <div className="p-4 border border-blue-200 bg-blue-50 rounded">
          <h3 className="font-semibold text-blue-900">Diagnosis Engine:</h3>
          <p className="text-blue-800 mt-1">{diagnosisMsg}</p>
        </div>
      )}

      {learnerState.status === "INTERVENTION" || learnerState.status === "PERSISTENT" ? (
        <div className="p-4 border border-orange-200 bg-orange-50 rounded">
          <h3 className="font-semibold text-orange-900">Intervention (Level {interventionLevel}):</h3>
          <p className="text-orange-800 mt-1">{interventionText}</p>
        </div>
      ) : null}
      
      {DEMO_MODE && (
        <div className="text-sm text-gray-500 text-center pt-4">
          Running in Local DEMO_MODE (Supabase Persistence Disabled)
        </div>
      )}
    </div>
  );
}
