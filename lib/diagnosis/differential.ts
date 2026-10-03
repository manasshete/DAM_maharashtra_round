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

  const predictedClass = result.prediction;
  const probability = result.probabilities[predictedClass] || 0;
  
  // 2. We only care if the model predicts a known misconception for this question
  // If the model predicts RUNTIME_ERROR, SYNTAX_ERROR, or OTHER_UNKNOWN, we shouldn't diagnose M02.
  const isMisconception = predictedClass.startsWith("M");
  
  if (!isMisconception) {
    return {
      status: "ABSTAIN",
      candidateId: predictedClass,
      explanation: `Behavior classified as ${predictedClass}. Does not strongly map to a known misconception.`,
      needsDiagnosticQuestion: false
    };
  }

  // 3. Evidence sufficiency check (confidence threshold)
  // Example: if only "ast_items_1" is present, Naive Bayes might output M02 but with low probability if 
  // OTHER_UNKNOWN is also likely.
  if (probability < CONFIDENCE_THRESHOLD) {
    return {
      status: "ABSTAIN",
      candidateId: predictedClass,
      explanation: `Model suspects ${predictedClass} but confidence (${(probability * 100).toFixed(1)}%) is below threshold. Stronger evidence required.`,
      needsDiagnosticQuestion: true // ambiguous case
    };
  }
  
  // 4. Verification against question targets (Safety guard)
  if (!input.question.misconceptionTargets.includes(predictedClass)) {
    return {
      status: "ABSTAIN",
      candidateId: predictedClass,
      explanation: `Model predicted ${predictedClass}, but this question is not designed to target it.`,
      needsDiagnosticQuestion: false
    };
  }

  // 5. Hard Differential Rule for M02 specifically
  // "A single code pattern must never be sufficient to diagnose M02."
  // If the ONLY feature we have is ast_items_1, force ABSTAIN.
  if (predictedClass === "M02") {
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
  }

  // 6. Passed all gates
  return {
    status: "DIAGNOSED",
    candidateId: predictedClass,
    explanation: `Evidence strongly supports ${predictedClass} (Confidence: ${(probability * 100).toFixed(1)}%).`,
    needsDiagnosticQuestion: false
  };
}
