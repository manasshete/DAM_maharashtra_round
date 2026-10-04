import { MisconceptionModel, FeatureVector } from "./model/MisconceptionModel";
import { Diagnosis } from "../../contracts/schemas";
import { QuestionSpec } from "../../contracts/schemas";

export interface DifferentialDiagnosisInput {
  features: FeatureVector;
  model: MisconceptionModel;
  question: QuestionSpec;
}

// Threshold above which we are confident to make a diagnosis
const CONFIDENCE_THRESHOLD = 0.8;

export async function runDifferentialDiagnosis(input: DifferentialDiagnosisInput): Promise<Diagnosis> {
  // 1. Get model predictions
  const result = await input.model.predict(input.features);
  
  if (!result || !result.prediction) {
    return {
      status: "ABSTAIN",
      explanation: "No model predictions available.",
      needsDiagnosticQuestion: false
    };
  }

  let predictedClass = result.prediction;
  const probability = result.probabilities[predictedClass] || 0;
  
  // 2. Identify Contradictory Conceptual Evidence
  // A correct execution result should NOT automatically cancel high-quality conceptual evidence.
  let contradictoryCandidate: string | null = null;
  if (input.features["reasoning_index_1"]) {
    contradictoryCandidate = "M02";
  } else if (input.features["reasoning_range_starts_1"]) {
    contradictoryCandidate = "M01";
  } else if (input.features["reasoning_includes_endpoint"] || input.features["reasoning_off_by_one"]) {
    contradictoryCandidate = "M03";
  }

  let activeCandidate = predictedClass;
  let isContradictoryOverride = false;

  // If the model predicted a non-misconception (or got distracted by correct output) but we have
  // explicit contradictory reasoning, the misconception candidate remains viable.
  if (contradictoryCandidate && (!predictedClass.startsWith("M") || input.features["output_correct"])) {
    activeCandidate = contradictoryCandidate;
    isContradictoryOverride = true;
  }

  // 3. We only care if the active candidate is a known misconception for this question
  const isMisconception = activeCandidate.startsWith("M");
  
  if (!isMisconception) {
    return {
      status: "ABSTAIN",
      candidateId: activeCandidate,
      explanation: `Behavior classified as ${activeCandidate}. Does not strongly map to a known misconception.`,
      needsDiagnosticQuestion: false
    };
  }

  // 4. Evidence sufficiency check (confidence threshold)
  // We bypass the statistical confidence threshold ONLY IF we have explicit contradictory conceptual evidence.
  if (!isContradictoryOverride && probability < CONFIDENCE_THRESHOLD) {
    return {
      status: "ABSTAIN",
      candidateId: activeCandidate,
      explanation: `Model suspects ${activeCandidate} but confidence (${(probability * 100).toFixed(1)}%) is below threshold. Stronger evidence required.`,
      needsDiagnosticQuestion: true // ambiguous case
    };
  }
  
  // 5. Verification against question targets (Safety guard)
  if (!input.question.misconceptionTargets.includes(activeCandidate)) {
    return {
      status: "ABSTAIN",
      candidateId: activeCandidate,
      explanation: `Candidate ${activeCandidate} identified, but this question is not designed to target it.`,
      needsDiagnosticQuestion: false
    };
  }

  // 6. Hard Differential Rules
  if (activeCandidate === "M02") {
    // "A single code pattern must never be sufficient to diagnose M02."
    const hasStrongM02Evidence = 
      input.features["output_incorrect_second_element"] || 
      input.features["reasoning_index_1"];
      
    if (!hasStrongM02Evidence && input.features["ast_items_1"]) {
      return {
        status: "ABSTAIN",
        candidateId: "M02",
        explanation: "Found items[1] in AST, but this single code pattern is insufficient without behavioral or reasoning evidence.",
        needsDiagnosticQuestion: true
      };
    }
  } else if (activeCandidate === "M01") {
    const hasStrongM01Evidence = input.features["reasoning_range_starts_1"];
    if (!hasStrongM01Evidence && !input.features["output_incorrect_other"]) {
      return {
        status: "ABSTAIN",
        candidateId: "M01",
        explanation: "Weak evidence for M01 without output mismatch or explicit reasoning.",
        needsDiagnosticQuestion: true
      };
    }
  } else if (activeCandidate === "M03") {
    const hasStrongM03Evidence = input.features["reasoning_includes_endpoint"] || input.features["reasoning_off_by_one"];
    if (!hasStrongM03Evidence && !input.features["output_incorrect_other"]) {
      return {
        status: "ABSTAIN",
        candidateId: "M03",
        explanation: "Weak evidence for M03 without output mismatch or explicit reasoning.",
        needsDiagnosticQuestion: true
      };
    }
  }

  // 7. Passed all gates
  return {
    status: "DIAGNOSED",
    candidateId: activeCandidate,
    explanation: isContradictoryOverride 
      ? `Explicit contradictory reasoning identified for ${activeCandidate} despite execution outcome.`
      : `Evidence strongly supports ${activeCandidate} (Confidence: ${(probability * 100).toFixed(1)}%).`,
    needsDiagnosticQuestion: false
  };
}
