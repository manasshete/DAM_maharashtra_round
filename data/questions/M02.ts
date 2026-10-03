import { QuestionSpec } from "../../contracts/schemas";

export const M02_QUESTION: QuestionSpec = {
  id: "q_m02_basic",
  concept: "list_indexing",
  expectedBehavior: {
    output: "apple",
    astPatterns: ["index=0"]
  },
  misconceptionTargets: ["M02"],
  evidenceRules: [
    {
      type: "AST_PATTERN",
      condition: "items[1]",
      strength: "LOW", // Because items[1] could mean 'second element' if they misunderstood the prompt
      providesFeature: "ast_items_1"
    },
    {
      type: "EXECUTION_OUTPUT",
      condition: "banana", // The second element, which implies items[1] was actually executed and output
      strength: "MODERATE",
      providesFeature: "output_incorrect_second_element"
    },
    {
      type: "REASONING",
      condition: "first.*index.*1", // Regex or semantic match showing belief that index 1 = first
      strength: "HIGH",
      providesFeature: "reasoning_index_1"
    }
  ],
  diagnosticQuestions: [
    "In Python, what is the exact index of the very first item in this list?"
  ],
  reassessmentVariants: [
    "q_m02_reassess_1",
    "q_m02_reassess_2"
  ],
  difficulty: 1
};
