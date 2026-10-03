import { ExecutionResult } from "../execution/CodeVerifier";
import { FeatureVector } from "../diagnosis/model/MisconceptionModel";
import { QuestionSpec } from "../../contracts/schemas";

export interface EvidenceExtractionInput {
  execution: ExecutionResult;
  reasoning?: string;
  diagnosticResponse?: string;
  question: QuestionSpec;
}

export function extractFeatures(input: EvidenceExtractionInput): FeatureVector {
  const features: FeatureVector = {};

  // 1. execution output features
  if (input.execution.status === "SUCCESS") {
    const out = input.execution.stdout.trim();
    if (out === input.question.expectedBehavior.output) {
      features["output_correct"] = 1;
    } else {
      // Very naive matching for the M02 mock: 
      // If we expect 'apple', and got 'banana', they printed index 1.
      if (out === "banana") {
        features["output_incorrect_second_element"] = 1;
      } else {
        features["output_incorrect_other"] = 1;
      }
    }
  }

  // 2. error features
  if (input.execution.status === "ERROR") {
    if (input.execution.errorType === "SyntaxError") {
      features["syntax_error"] = 1;
    } else if (input.execution.errorType === "IndexError") {
      features["ast_index_out_of_bounds"] = 1;
      features["runtime_error"] = 1;
    } else {
      features["runtime_error"] = 1;
    }
  }

  // 3. AST features
  for (const ast of input.execution.astEvidence || []) {
    if (ast.nodeType === "Subscript") {
      if (ast.source === "index=1") {
        features["ast_items_1"] = 1;
      } else if (ast.source === "index=0") {
        features["ast_items_0"] = 1;
      }
    }
  }

  // 4. Reasoning / Diagnostic features
  const textToAnalyze = `${input.reasoning || ""} ${input.diagnosticResponse || ""}`.toLowerCase();
  
  if (textToAnalyze.includes("first") && textToAnalyze.includes("1")) {
    features["reasoning_index_1"] = 1;
  }
  
  if (textToAnalyze.includes("subtract one") || textToAnalyze.includes("minus 1") || textToAnalyze.includes("off by one")) {
    features["reasoning_off_by_one"] = 1;
  }

  return features;
}
