import { z } from "zod";
import { ResolutionState } from "../lib/learner/resolution";

export const QuestionSpecSchema = z.object({
  id: z.string(),
  concept: z.string(),
  expectedBehavior: z.object({
    output: z.string().optional(),
    astPatterns: z.array(z.string()).optional()
  }),
  misconceptionTargets: z.array(z.string()),
  evidenceRules: z.array(z.any()), // Will define specific rule structure later
  diagnosticQuestions: z.array(z.string()),
  reassessmentVariants: z.array(z.string()),
  difficulty: z.number()
});

export const AttemptSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  learnerId: z.string(),
  code: z.string(),
  reasoning: z.string().optional(),
  submittedAt: z.string().datetime()
});

export const EvidenceSchema = z.object({
  type: z.enum([
    "ANSWER_PATTERN",
    "AST_PATTERN",
    "EXECUTION",
    "TRACE",
    "REASONING",
    "DIAGNOSTIC_RESPONSE",
    "HISTORY"
  ]),
  sourceId: z.string(),
  observation: z.string(),
  supports: z.array(z.string()),
  contradicts: z.array(z.string()),
  reliability: z.enum(["HIGH", "MODERATE", "LOW"])
});

export const DiagnosisSchema = z.object({
  status: z.enum(["DIAGNOSED", "ABSTAIN"]),
  candidateId: z.string().optional(),
  evidenceIds: z.array(z.string()).optional(),
  explanation: z.string(),
  needsDiagnosticQuestion: z.boolean().default(false)
});

export type Attempt = z.infer<typeof AttemptSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type Diagnosis = z.infer<typeof DiagnosisSchema>;
export type QuestionSpec = z.infer<typeof QuestionSpecSchema>;
