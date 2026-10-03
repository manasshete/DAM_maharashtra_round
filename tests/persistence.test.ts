import { describe, it, expect, beforeEach } from 'vitest';
import { transitionMisconceptionState, createInitialState, MisconceptionState, LearningEvent } from '../lib/learner/resolution';
import { persistAttempt, loadLearnerState, saveLearnerState, DEMO_MODE } from '../lib/db/client';

describe('Learner State Persistence and Resolution Engine', () => {
  let state: MisconceptionState;

  beforeEach(() => {
    state = createInitialState("M02");
    state.status = "INTERVENTION";
  });

  it('F1. Direct success does NOT equal VERIFIED_RESOLVED', () => {
    const event: LearningEvent = {
      type: "DIRECT_REASSESSMENT",
      result: { isCorrect: true, hasMisconceptionReasoning: false }
    };
    
    state = transitionMisconceptionState(state, event);
    
    // Direct success should just be IMPROVING, not VERIFIED_RESOLVED
    expect(state.status).toBe("IMPROVING");
    expect(state.immediateEvidence?.isCorrect).toBe(true);
  });

  it('F2 & F5. Direct success + Transfer Success advances to VERIFIED_RESOLVED', () => {
    // 1. Direct success
    state = transitionMisconceptionState(state, {
      type: "DIRECT_REASSESSMENT",
      result: { isCorrect: true, hasMisconceptionReasoning: false }
    });
    expect(state.status).toBe("IMPROVING");

    // 2. Transfer success
    state = transitionMisconceptionState(state, {
      type: "TRANSFER_REASSESSMENT",
      result: { isCorrect: true, hasMisconceptionReasoning: false }
    });
    expect(state.status).toBe("VERIFIED_RESOLVED");
    expect(state.transferEvidence?.isCorrect).toBe(true);
    expect(state.reasoningEvidence?.isCorrect).toBe(true);
  });

  it('F3. Correct answer + contradictory reasoning remains PERSISTENT', () => {
    state = transitionMisconceptionState(state, {
      type: "DIRECT_REASSESSMENT",
      result: { isCorrect: true, hasMisconceptionReasoning: true } // Contradictory reasoning!
    });
    
    expect(state.status).toBe("PERSISTENT");
  });

  it('F4. Failed transfer prevents VERIFIED_RESOLVED', () => {
    // Direct success
    state = transitionMisconceptionState(state, {
      type: "DIRECT_REASSESSMENT",
      result: { isCorrect: true, hasMisconceptionReasoning: false }
    });

    // Transfer failed
    state = transitionMisconceptionState(state, {
      type: "TRANSFER_REASSESSMENT",
      result: { isCorrect: false, hasMisconceptionReasoning: true }
    });

    expect(state.status).toBe("PERSISTENT");
    expect(state.status).not.toBe("VERIFIED_RESOLVED");
  });

  it('F6 & F7. DEMO_MODE works and state persists/restores in memory', async () => {
    expect(DEMO_MODE).toBe(true); // Should be true since no env vars are set in test

    const testLearnerId = "test_learner_123";
    const testState = createInitialState("M02");
    testState.status = "IMPROVING";

    await saveLearnerState(testLearnerId, testState);
    
    const loadedState = await loadLearnerState(testLearnerId, "M02");
    expect(loadedState).not.toBeNull();
    expect(loadedState?.status).toBe("IMPROVING");
    expect(loadedState?.misconceptionId).toBe("M02");
  });
});
