export type ResolutionState =
  | "UNKNOWN"
  | "SUSPECTED"
  | "DIAGNOSED"
  | "INTERVENTION"
  | "IMPROVING"
  | "PERSISTENT"
  | "LIKELY_RESOLVED"
  | "RETENTION_CHECK"
  | "VERIFIED_RESOLVED"
  | "REAPPEARED";

export interface ReassessmentResult {
  isCorrect: boolean;
  hasMisconceptionReasoning: boolean;
}

export interface MisconceptionState {
  misconceptionId: string;
  status: ResolutionState;
  immediateEvidence: ReassessmentResult | null;
  transferEvidence: ReassessmentResult | null;
  reasoningEvidence: ReassessmentResult | null;
}

export interface LearningEvent {
  type: "EVIDENCE_COLLECTED" | "DIAGNOSIS_MADE" | "INTERVENTION_DELIVERED" | "DIRECT_REASSESSMENT" | "TRANSFER_REASSESSMENT";
  evidenceStrength?: "HIGH" | "MODERATE" | "LOW" | "CONTRADICTORY";
  result?: ReassessmentResult;
}

export function createInitialState(misconceptionId: string): MisconceptionState {
  return {
    misconceptionId,
    status: "UNKNOWN",
    immediateEvidence: null,
    transferEvidence: null,
    reasoningEvidence: null
  };
}

export function transitionMisconceptionState(
  state: MisconceptionState,
  event: LearningEvent
): MisconceptionState {
  const newState = { ...state };

  if (event.type === "DIAGNOSIS_MADE") {
    newState.status = "DIAGNOSED";
    return newState;
  }

  if (event.type === "INTERVENTION_DELIVERED") {
    newState.status = "INTERVENTION";
    return newState;
  }

  if (event.type === "DIRECT_REASSESSMENT" && event.result) {
    newState.immediateEvidence = event.result;
    
    if (!event.result.isCorrect || event.result.hasMisconceptionReasoning) {
      newState.status = "PERSISTENT";
    } else {
      newState.status = "IMPROVING";
    }
    return newState;
  }

  if (event.type === "TRANSFER_REASSESSMENT" && event.result) {
    newState.transferEvidence = event.result;
    // Assuming transfer reassessment also captures reasoning logic
    newState.reasoningEvidence = event.result;
    
    if (!event.result.isCorrect || event.result.hasMisconceptionReasoning) {
      newState.status = "PERSISTENT";
    } else {
      // Transfer success + Reasoning success -> VERIFIED_RESOLVED
      if (newState.immediateEvidence?.isCorrect && !newState.immediateEvidence?.hasMisconceptionReasoning) {
        newState.status = "VERIFIED_RESOLVED";
      } else {
        // If immediate wasn't clean but transfer is? Unlikely path, but let's say LIKELY_RESOLVED
        newState.status = "LIKELY_RESOLVED";
      }
    }
    return newState;
  }

  return newState;
}
