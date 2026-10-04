import { ExecutionResult } from "../execution/CodeVerifier";
import { QuestionSpec, Diagnosis } from "../../contracts/schemas";
import { runDifferentialDiagnosis } from "../diagnosis/differential";
import { MisconceptionModel } from "../diagnosis/model/MisconceptionModel";
import { extractFeatures } from "../evidence/extractor";
import { LearningEvent } from "./resolution";

export interface ReassessmentInput {
  execution: ExecutionResult;
  reasoning: string;
  question: QuestionSpec;
  model: MisconceptionModel;
  targetMisconceptionId: string;
}

export async function evaluateReassessment(input: ReassessmentInput): Promise<LearningEvent> {
  // 1. Analyze the new attempt for evidence of the targeted misconception
  const features = extractFeatures({
    execution: input.execution,
    reasoning: input.reasoning,
    question: input.question
  });

  const diagnosis = await runDifferentialDiagnosis({
    features,
    model: input.model,
    question: input.question
  });

  // 2. Correct-Answer Trap Logic
  // If the user got the expected output, but the differential diagnosis still flags the misconception
  // (e.g. via reasoning), it is NOT resolved.
  const isBehaviorCorrect = input.execution.status === "SUCCESS" && 
                            input.execution.stdout.trim() === input.question.expectedBehavior.output;

  const misconceptionStillPresent = (diagnosis.status === "DIAGNOSED" && diagnosis.candidateId === input.targetMisconceptionId) ||
                                    !!features["reasoning_index_1"]; // Explicit check for reasoning trace if model abstains due to low prob

  if (isBehaviorCorrect && !misconceptionStillPresent) {
    return {
      type: input.question.id.includes("transfer") ? "TRANSFER_REASSESSMENT" : "DIRECT_REASSESSMENT",
      evidenceStrength: "HIGH",
      result: {
        isCorrect: true,
        hasMisconceptionReasoning: false
      }
    };
  }

  if (isBehaviorCorrect && misconceptionStillPresent) {
    return {
      type: input.question.id.includes("transfer") ? "TRANSFER_REASSESSMENT" : "DIRECT_REASSESSMENT",
      evidenceStrength: "CONTRADICTORY",
      result: {
        isCorrect: true,
        hasMisconceptionReasoning: true
      }
    };
  }

  return {
    type: input.question.id.includes("transfer") ? "TRANSFER_REASSESSMENT" : "DIRECT_REASSESSMENT",
    evidenceStrength: "HIGH",
    result: {
      isCorrect: false,
      hasMisconceptionReasoning: misconceptionStillPresent
    }
  };
}
