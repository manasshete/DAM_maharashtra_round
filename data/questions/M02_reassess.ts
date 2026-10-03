import { QuestionSpec } from "../../contracts/schemas";

export const M02_REASSESS_DIRECT: QuestionSpec = {
  id: "q_m02_reassess_direct",
  concept: "list_indexing",
  expectedBehavior: {
    output: "monday",
    astPatterns: ["index=0"]
  },
  misconceptionTargets: ["M02"],
  evidenceRules: [
    { type: "AST_PATTERN", condition: "items[1]", strength: "LOW", providesFeature: "ast_items_1" },
    { type: "EXECUTION_OUTPUT", condition: "tuesday", strength: "MODERATE", providesFeature: "output_incorrect_second_element" },
    { type: "REASONING", condition: "first.*index.*1", strength: "HIGH", providesFeature: "reasoning_index_1" }
  ],
  diagnosticQuestions: [],
  reassessmentVariants: [],
  difficulty: 1
};

export const M02_REASSESS_TRANSFER: QuestionSpec = {
  id: "q_m02_reassess_transfer",
  concept: "list_indexing",
  expectedBehavior: {
    output: "a",
    astPatterns: ["index=0"]
  },
  misconceptionTargets: ["M02"],
  evidenceRules: [
    { type: "AST_PATTERN", condition: "items[1]", strength: "LOW", providesFeature: "ast_items_1" },
    { type: "EXECUTION_OUTPUT", condition: "b", strength: "MODERATE", providesFeature: "output_incorrect_second_element" },
    { type: "REASONING", condition: "first.*index.*1", strength: "HIGH", providesFeature: "reasoning_index_1" }
  ],
  diagnosticQuestions: [],
  reassessmentVariants: [],
  difficulty: 2
};
