import { describe, it, expect, beforeAll } from 'vitest';
import { NaiveBayesClassifier } from '../lib/diagnosis/model/classifier';
import { InterventionEngine } from '../lib/intervention/engine';
import { evaluateReassessment } from '../lib/learner/reassessment';
import { M02_REASSESS_DIRECT, M02_REASSESS_TRANSFER } from '../data/questions/M02_reassess';
import { transitionMisconceptionState, createInitialState } from '../lib/learner/resolution';

describe('Intervention & Adaptive Reassessment Engine', () => {
  let model: NaiveBayesClassifier;
  let engine: InterventionEngine;

  beforeAll(async () => {
    model = new NaiveBayesClassifier();
    const fs = await import('fs');
    const path = await import('path');
    const modelData = fs.readFileSync(path.join(__dirname, '../data/eval/misconception_model_v1.json'), 'utf-8');
    model.load(modelData);
    
    engine = new InterventionEngine();
  });

  describe('A/B. Intervention Engine', () => {
    it('Should deliver M02 Level 1 Hint without revealing answer', () => {
      const hint = engine.getIntervention("M02", 1);
      expect(hint).toContain("Wait a second...");
      expect(hint).not.toContain("starts at 0");
    });
  });

  describe('C/D/E. Reassessment & Resolution Transitions', () => {
    it('Direct Reassessment: Failed (misconception persists)', async () => {
      let state = createInitialState("M02");
      state.status = "INTERVENTION";
      
      const event = await evaluateReassessment({
        execution: {
          status: "SUCCESS",
          stdout: "tuesday",
          stderr: "",
          errorType: null,
          errorLine: null,
          traceEvents: [],
          astEvidence: [{ nodeType: "Subscript", source: "index=1", line: 1 }]
        },
        reasoning: "I want the second day",
        question: M02_REASSESS_DIRECT,
        model,
        targetMisconceptionId: "M02"
      });

      expect(event.result?.isCorrect).toBe(false);
      state = transitionMisconceptionState(state, event);
      expect(state.status).toBe("PERSISTENT");
    });

    it('Transfer Reassessment: Correct Answer + Incorrect Reasoning (TRAP)', async () => {
      let state = createInitialState("M02");
      state.status = "INTERVENTION";
      
      const event = await evaluateReassessment({
        execution: {
          status: "SUCCESS",
          stdout: "a",
          stderr: "",
          errorType: null,
          errorLine: null,
          traceEvents: [],
          astEvidence: [{ nodeType: "Subscript", source: "index=0", line: 1 }]
        },
        reasoning: "the first index is 1 so i subtracted 1",
        question: M02_REASSESS_TRANSFER,
        model,
        targetMisconceptionId: "M02"
      });

      expect(event.result?.isCorrect).toBe(true);
      expect(event.result?.hasMisconceptionReasoning).toBe(true);
      
      state = transitionMisconceptionState(state, event);
      expect(state.status).toBe("PERSISTENT"); 
    });

    it('Complete Chain: Direct Success -> Transfer Success -> VERIFIED_RESOLVED', async () => {
      let state = createInitialState("M02");
      state.status = "INTERVENTION";
      
      const event1 = await evaluateReassessment({
        execution: {
          status: "SUCCESS",
          stdout: "monday",
          stderr: "",
          errorType: null,
          errorLine: null,
          traceEvents: [],
          astEvidence: [{ nodeType: "Subscript", source: "index=0", line: 1 }]
        },
        reasoning: "starts at 0",
        question: M02_REASSESS_DIRECT,
        model,
        targetMisconceptionId: "M02"
      });

      state = transitionMisconceptionState(state, event1);
      expect(state.status).toBe("IMPROVING"); 
      
      const event2 = await evaluateReassessment({
        execution: {
          status: "SUCCESS",
          stdout: "a",
          stderr: "",
          errorType: null,
          errorLine: null,
          traceEvents: [],
          astEvidence: [{ nodeType: "Subscript", source: "index=0", line: 1 }]
        },
        reasoning: "list indexes start at 0",
        question: M02_REASSESS_TRANSFER,
        model,
        targetMisconceptionId: "M02"
      });

      state = transitionMisconceptionState(state, event2);
      expect(state.status).toBe("VERIFIED_RESOLVED"); 
    });
  });
});
