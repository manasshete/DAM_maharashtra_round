import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { NaiveBayesClassifier } from '../lib/diagnosis/model/classifier';
import { extractFeatures, EvidenceExtractionInput } from '../lib/evidence/extractor';
import { runDifferentialDiagnosis } from '../lib/diagnosis/differential';
import { createInitialState, transitionMisconceptionState } from '../lib/learner/resolution';
import { QuestionSpec } from '../contracts/schemas';

const EVAL_QUESTION: QuestionSpec = {
  id: "q_eval",
  concept: "list_and_range",
  expectedBehavior: {
    output: "apple",
  },
  misconceptionTargets: ["M01", "M02", "M03", "CARELESS_ERROR", "SYNTAX_ERROR", "RUNTIME_ERROR"],
  evidenceRules: [],
  diagnosticQuestions: [],
  reassessmentVariants: [],
  difficulty: 1
};

describe('End-to-End System Evaluation (Phase 2E)', () => {
  let classifier: NaiveBayesClassifier;

  beforeAll(() => {
    const artifactPath = path.join(__dirname, '../data/eval/misconception_model_v1.json');
    if (!fs.existsSync(artifactPath)) {
      throw new Error("Model artifact not found for testing.");
    }
    const modelData = fs.readFileSync(artifactPath, 'utf-8');
    classifier = new NaiveBayesClassifier();
    classifier.load(modelData);
  });

  it('A. Correct learner - should abstain & leave state UNKNOWN', async () => {
    const input: EvidenceExtractionInput = {
      execution: { status: "SUCCESS", stdout: "apple", errorType: null, astEvidence: [] },
      reasoning: "I printed the first element correctly.",
      question: EVAL_QUESTION
    };
    const features = extractFeatures(input);
    const diagnosis = await runDifferentialDiagnosis({ features, model: classifier, question: EVAL_QUESTION });
    expect(diagnosis.status).toBe("ABSTAIN");

    const state = createInitialState("UNKNOWN");
    expect(state.status).toBe("UNKNOWN");
  });

  it('I. Correct-answer trap - Correct output but contradictory reasoning', async () => {
    // Correct-answer trap applies during reassessment. 
    // The student got the code right but reasoning is wrong.
    let state = createInitialState("M02");
    state = transitionMisconceptionState(state, { type: "DIAGNOSIS_MADE" });
    state = transitionMisconceptionState(state, { type: "INTERVENTION_DELIVERED" });
    
    // They answer the direct reassessment with correct code, but wrong reasoning
    state = transitionMisconceptionState(state, { type: "DIRECT_REASSESSMENT", result: { isCorrect: true, hasMisconceptionReasoning: true } });
    
    expect(state.status).toBe("PERSISTENT"); // Trap caught it!
  });

  it('L. Genuine resolution - verified across types', async () => {
    let state = createInitialState("M02");
    state = transitionMisconceptionState(state, { type: "DIAGNOSIS_MADE" });
    state = transitionMisconceptionState(state, { type: "INTERVENTION_DELIVERED" });
    state = transitionMisconceptionState(state, { type: "DIRECT_REASSESSMENT", result: { isCorrect: true, hasMisconceptionReasoning: false } });
    expect(state.status).toBe("IMPROVING");
    
    state = transitionMisconceptionState(state, { type: "TRANSFER_REASSESSMENT", result: { isCorrect: true, hasMisconceptionReasoning: false } });
    expect(state.status).toBe("VERIFIED_RESOLVED");
  });

  it('J. Failed transfer reassessment', async () => {
    let state = createInitialState("M02");
    state = transitionMisconceptionState(state, { type: "DIAGNOSIS_MADE" });
    state = transitionMisconceptionState(state, { type: "INTERVENTION_DELIVERED" });
    state = transitionMisconceptionState(state, { type: "DIRECT_REASSESSMENT", result: { isCorrect: true, hasMisconceptionReasoning: false } });
    expect(state.status).toBe("IMPROVING");
    
    state = transitionMisconceptionState(state, { type: "TRANSFER_REASSESSMENT", result: { isCorrect: false, hasMisconceptionReasoning: false } });
    expect(state.status).toBe("PERSISTENT");
  });

  describe('Phase 2E.1: Correct-Answer Trap Hardening in Diagnosis', () => {
    it('Correct answer + contradictory reasoning -> Misconception is NOT discarded', async () => {
      const input: EvidenceExtractionInput = {
        execution: { status: "SUCCESS", stdout: "apple", errorType: null, astEvidence: [] },
        reasoning: "I got apple, the first index is 1",
        question: EVAL_QUESTION
      };
      const features = extractFeatures(input);
      const diagnosis = await runDifferentialDiagnosis({ features, model: classifier, question: EVAL_QUESTION });
      
      expect(diagnosis.status).toBe("DIAGNOSED");
      expect(diagnosis.candidateId).toBe("M02");
      expect(diagnosis.explanation).toContain("Explicit contradictory reasoning identified for M02 despite execution outcome");
    });

    it('Correct answer + correct reasoning -> System ABSTAINs', async () => {
      const input: EvidenceExtractionInput = {
        execution: { status: "SUCCESS", stdout: "apple", errorType: null, astEvidence: [] },
        reasoning: "The first index is 0, so items[0] gives the first item.",
        question: EVAL_QUESTION
      };
      const features = extractFeatures(input);
      const diagnosis = await runDifferentialDiagnosis({ features, model: classifier, question: EVAL_QUESTION });
      
      expect(diagnosis.status).toBe("ABSTAIN");
    });

    it('Correct answer + no reasoning -> System ABSTAINs', async () => {
      const input: EvidenceExtractionInput = {
        execution: { status: "SUCCESS", stdout: "apple", errorType: null, astEvidence: [] },
        reasoning: "",
        question: EVAL_QUESTION
      };
      const features = extractFeatures(input);
      const diagnosis = await runDifferentialDiagnosis({ features, model: classifier, question: EVAL_QUESTION });
      
      expect(diagnosis.status).toBe("ABSTAIN");
    });
  });
});
