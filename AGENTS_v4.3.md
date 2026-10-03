# Re:Learn Agent Rules — v4.3

## Architecture
1. Read this file before changing architecture.
2. Keep domain logic separate from UI and infrastructure.
3. Use shared Zod contracts across frontend, backend, persistence, and AI.
4. Do not add dependencies when existing dependencies solve the need.

## Execution
5. Never execute student code directly in the application server process.
6. Student input is untrusted.
7. Use Pyodide in a Web Worker for the primary MVP execution path.
8. Preload/self-host Pyodide assets when practical; use immutable cache headers.
9. Do not preload Pandas/NumPy in the intro-programming MVP.
10. Depend on a provider-independent `CodeVerifier` interface.
11. Do not commit the MVP to Judge0, E2B, or Modal until authoritative server verification is actually needed.

## Diagnosis
12. Observation is not diagnosis: never map a single code pattern directly to a misconception.
13. Deterministic grading/evidence comes before AI interpretation where possible.
14. Every diagnosis must cite the evidence supporting it.
15. Behavioral evidence alone may be insufficient; combine intent, execution/output, AST, reasoning, diagnostic responses, or history when needed.
16. The LLM cannot invent permanent taxonomy IDs.
17. Allow diagnosis abstention.
18. Never produce a high-confidence diagnosis without supporting evidence.
19. Do not expose raw model confidence percentages to learners.
20. Correct answers alone never prove misconception resolution.
24. Keep `OTHER / NOVEL` temporary and reviewable.
25. Start with weighted evidence scoring; defer Bayesian inference until the evidence pipeline is validated.
26. Keep multiple misconceptions as ranked candidates in the MVP.

## AI
24. Keep provider-specific AI code behind the AI gateway.
25. Use `generateText` + `Output.object({ schema })` for structured AI output.
26. Do not use manual JSON parsing or deprecated `generateObject` in new code.
27. Treat `NoObjectGeneratedError` as a retry/AI-unavailable path.
28. Enforce taxonomy IDs, `OTHER`, and `abstain` in Zod schemas.
29. Use one primary model and one fallback during MVP development.
30. Core telemetry is `ai_runs`.
31. Langfuse is optional and must not be required for runtime, demo, or evaluation.
32. If Langfuse is enabled, use its AI SDK/OpenTelemetry integration rather than manual wrapping.
33. Trace important AI calls and apply rate/cost limits.

## Learning and resolution
34. Use targeted interventions: refutation, contrastive example, micro-practice.
35. Reassess with direct, reasoning, or transfer evidence.
36. Distinguish `LIKELY_RESOLVED` from `VERIFIED_RESOLVED`.
37. `VERIFIED_RESOLVED` requires two independent items in different formats, at least one reasoning/trace item, a retention check, and no contradictory evidence.
38. Do not claim delayed retention verification unless it actually happened or is explicitly simulated.
39. Keep concept mastery separate from misconception persistence.
40. Implement resolution as a pure TypeScript function in `lib/learner`.
41. Apply only the new event to the current misconception state; do not recompute complete history for every attempt.
42. Do not move core resolution logic into Supabase database webhooks or Edge Functions in the MVP.
43. The same resolution function must work in API code, tests, evaluation scripts, and offline demo mode.

## Product
44. Do not turn Re:Learn into a generic chatbot.
45. Use controlled question assets; do not add AI-generated question variants in the MVP.
46. Preserve offline demo mode.
47. Clearly label simulated learner/evaluation results.
48. Do not fabricate evaluation results.
49. Do not add more misconceptions until the M02 first vertical slice is stable.
50. Keep the hero demo aligned with M02: first list index is 1.
51. M01 (`range(n)` includes `n`) is a later misconception.

## Evaluation
52. Target approximately 80–110 hand-verified examples.
53. Hold out 30–40 examples for testing.
54. Report overall accuracy, Macro-F1, confusion-pair accuracy, abstention/unsupported-diagnosis rate, and confidence intervals where appropriate.
55. Maintain a one-shot LLM baseline and compare it with the full Re:Learn pipeline.

## UI
56. Use shadcn/ui for primitives.
57. Use Motion for meaningful state communication, not decoration.
58. Support reduced motion.
59. Keep the student experience modern, editorial, technical, calm, and precise.
60. Avoid generic AI SaaS visual tropes.


## v4.2 Hardening
61. Pyodide runs only inside the dedicated Web Worker for the MVP.
62. Worker commands are `RUN_CODE`, `PARSE_AST`, `RUN_TESTS`, `TRACE_EXECUTION`, and `HEALTH_CHECK`.
63. Worker execution must have a timeout and restart path.
64. Return structured execution results; do not use raw stdout as the evidence contract.
65. Self-host Pyodide assets under `public/pyodide` with immutable caching.
66. Preload Pyodide when the learner enters the problem workspace.
67. Do not load Pandas or NumPy in the MVP.
68. Do not choose a server sandbox provider until authoritative verification is required.
69. Keep `CodeVerifier` provider-independent.
70. Validate environment variables with Zod at startup.
71. Keep evaluation data in development and held-out JSONL sets; never tune on the held-out set.
72. Build the evaluation harness before adding many misconceptions.
73. The M02 hero flow is the first end-to-end Playwright path.

## v4.3 Diagnostic evidence rules
71. For M02, `items[1]` alone is weak evidence because it can legitimately mean “second element.”
72. Prefer combined evidence: task intent + output/execution + AST + reasoning + diagnostic response.
73. A diagnosis must reference concrete evidence IDs.
74. Add `QuestionSpec` and authored `EvidenceRule` metadata for controlled questions.
75. Do not silently replace live execution or AI with simulated/cached results; label every fallback.

## v4.3 Phase 1 checkpoints
76. Phase 1A = observation/evidence.
77. Phase 1B = diagnosis/abstention.
78. Phase 1C = intervention/reassessment/LIKELY_RESOLVED.
79. Phase 1D = retention/VERIFIED_RESOLVED/REAPPEARED/learner state.
80. Do not add infrastructure or additional misconceptions during Phase 1 unless required by the M02 slice.

## v4.3 Evaluation
81. Report evidence-sufficiency accuracy and abstention precision in addition to diagnosis metrics.
82. A correct label produced from insufficient evidence is still a diagnostic failure.
