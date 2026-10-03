# Re:Learn — Master Specification v4.3

**Version:** 4.2  
**Domain:** Introductory Programming — Python  
**Status:** Hackathon MVP specification  
**Primary goal:** Build and evaluate a misconception-aware learning system that diagnoses why a learner is wrong, intervenes on that misconception, and verifies whether it persists or has been resolved.

---

## 1. Product Definition

Re:Learn is an AI-powered misconception-aware programming tutor.

It does not simply mark an answer correct or incorrect. It observes how a learner solves a Python problem, collects evidence about the learner's reasoning and behavior, identifies one or more candidate misconceptions, differentiates between confusable misconceptions, provides a targeted intervention, and reassesses the learner to determine whether the misconception has actually been resolved.

### Core loop

**OBSERVE → COLLECT EVIDENCE → FORM CANDIDATES → DIFFERENTIAL DIAGNOSIS → VERIFY / ABSTAIN → TARGETED INTERVENTION → ADAPTIVE REASSESSMENT → RESOLUTION / PERSISTENCE → LEARNER MODEL → NEXT ACTIVITY**

The LLM is a component, not the product.

Deterministic systems should provide evidence wherever possible. LLMs are used for interpretation, candidate generation, explanation, and free-form reasoning analysis.

---

## 2. Problem Statement Mapping

The selected problem statement requires:

- misconception dataset
- misconception model
- differentiation between misconceptions that produce similar incorrect answers
- adaptive intervention
- post-intervention reassessment
- determination of whether the misconception is actually resolved
- learner model
- model evaluation

Re:Learn addresses these through:

| Requirement | Re:Learn component |
|---|---|
| Misconception dataset | Hand-verified belief-level taxonomy + gold evaluation set |
| Misconception model | Candidate scoring + evidence fusion |
| Differentiation | Confusion sets + diagnostic questions |
| Adaptive intervention | Refutation, contrastive example, micro-practice |
| Reassessment | Direct, transfer, reasoning checks |
| Resolution | Explicit resolution state machine |
| Learner model | Concept mastery + misconception persistence |
| Evaluation | Gold set, baseline, ablation, metrics |

The source problem statement specifies that a correct follow-up answer alone must not be treated as proof that learning occurred. fileciteturn0file0L199-L225

---

# 3. MVP Scope

## 3.1 Domain

Python introductory programming.

## 3.2 Initial misconception taxonomy

Start with five belief-level misconceptions rather than broad topic labels.

| ID | Misconception |
|---|---|
| M01 | `range(n)` includes `n` |
| M02 | The first list index is `1` |
| M03 | `return` prints a value |
| M04 | `=` compares values |
| M05 | Assignment creates an independent copy rather than an alias/reference |

These are examples for the first vertical slice. The taxonomy can expand after the core system works.

### Concepts vs misconceptions

A concept is not a misconception.

Example:

**Concept:** Python indexing  
**Misconceptions:** first index is 1; negative indexing is invalid; an index equal to list length is valid.

The taxonomy must describe the learner's incorrect belief, not merely the topic where the error occurred.

## 3.3 Novel misconception handling

The AI may propose an `OTHER / NOVEL` candidate.

It must:

- remain temporary
- never automatically create a permanent taxonomy ID
- be visible to tutor/reviewer workflows
- be logged for future taxonomy expansion

---

# 4. Confusion Sets

Re:Learn must explicitly model misconceptions that can produce similar observable errors.

A confusion set contains:

- candidate misconceptions
- shared symptom
- distinguishing evidence
- diagnostic questions
- expected response patterns
- intervention mapping

Example:

**Confusion group: indexing / loop boundary**

Possible evidence:

- selected distractor
- AST structure
- executed index
- runtime behavior
- explanation
- response to a diagnostic question

The system should ask a diagnostic question when the available evidence cannot sufficiently distinguish the candidates.

---

# 5. Evidence-First Architecture

## 5.1 Primary pipeline

```text
Student Attempt
      ↓
Observation Layer
      ├── Answer / distractor
      ├── Deterministic grading
      ├── Python AST
      ├── Pyodide execution
      ├── Tests / controlled tracing
      ├── Optional reasoning
      └── Learning history
      ↓
Evidence Engine
      ↓
Candidate Misconceptions
      ↓
Authored Evidence Rules
      ↓
Enough Evidence?
   ├── No → Diagnostic Question → Evidence Engine
   └── Yes → Diagnosis
                    ↓
             Targeted Intervention
                    ↓
              Reassessment
          ├── Direct
          ├── Reasoning
          └── Transfer
                    ↓
              Resolution Engine
                    ↓
               Learner Model
                    ↓
             Next Recommendation
```

## 5.2 Deterministic grading first

The system must attempt deterministic grading before asking an LLM to judge correctness.

Sources include:

- expected answer
- known distractor mappings
- unit tests
- AST checks
- execution results
- controlled traces

The AI interprets evidence. It should not replace deterministic grading where deterministic grading is possible.

---

# 6. Evidence Model

Every diagnosis must be explainable through evidence.

Example evidence object:

```ts
type Evidence = {
  type:
    | "ANSWER_PATTERN"
    | "AST_PATTERN"
    | "EXECUTION"
    | "TRACE"
    | "REASONING"
    | "DIAGNOSTIC_RESPONSE"
    | "HISTORY";
  sourceId: string;
  observation: string;
  supports: string[];
  contradicts: string[];
  reliability: "HIGH" | "MEDIUM" | "LOW";
};
```

The system should store evidence independently from diagnosis.

This allows:

- auditability
- replay
- evaluation
- tutor review
- diagnosis correction

---

# 7. Diagnosis Engine

## 7.0 M02 evidence hierarchy

For M02 (`the first list index is 1`), an observed `items[1]` access is **weak evidence** by itself because it can be a valid request for the second element.

Use evidence strength explicitly:

| Evidence | M02 strength |
|---|---|
| `items[1]` alone | Weak |
| Wrong first-element output | Moderate |
| Explicit reasoning such as “the first item is index 1” | High |
| Controlled diagnostic response confirming the belief | High |
| Repeated behavior across distinct contexts | Very high |

The evidence engine should therefore avoid:

```text
AST pattern → M02
```

and prefer:

```text
AST / output / reasoning / diagnostic response
→ evidence items
→ weighted evidence
→ candidate score
→ diagnosis or abstention
```

## 7.1 First MVP: weighted evidence scoring

Do not implement a full Bayesian diagnosis engine before the evidence model works.

Initial candidate score:

```text
candidate score =
    prior
  + evidence weights
  + diagnostic response weight
  + learner-history signal
  - contradiction penalty
```

Scores are internal engineering values.

Do not expose raw LLM confidence percentages such as `82% / 14% / 4%` to students.

UI should use semantic evidence states:

- High evidence
- Moderate evidence
- Insufficient evidence

## 7.2 Future Bayesian update

After the evidence pipeline is validated, candidate probability can be formalized as:

```text
P(M | E) ∝ P(E | M) P(M)
```

Diagnostic-question selection can later optimize expected information gain.

This is an extension, not a prerequisite for the first vertical slice.

## 7.3 Abstention

The diagnosis engine must be allowed to say:

> Insufficient evidence.

When uncertainty is high, the system should gather more evidence rather than invent a confident diagnosis.

## 7.4 Multiple misconceptions

The system may maintain a ranked list of candidates.

For MVP:

- identify a primary candidate
- retain secondary candidates
- use secondary candidates for differentiation and future reassessment

Do not attempt unrestricted simultaneous misconception modeling initially.

---

# 8. Diagnostic Questions

Diagnostic questions are controlled learning assets.

They should be selected using:

```text
diagnostic value
+ relevance
+ appropriate difficulty
- guessability
- fatigue/time cost
```

Initial selection is rule-based.

Future versions can use expected information gain.

## Guess protection

A multiple-choice answer alone can be lucky.

For high-value diagnostic questions, require one of:

- a short reason
- a structured trace table
- a predicted output
- a small code modification

Free-form explanation should not be mandatory for every low-stakes interaction.

---

# 9. Intervention Engine

The MVP uses three intervention types:

### 1. Refutation

Expose the contradiction between the learner's belief and actual Python behavior.

### 2. Contrastive example

Show two closely related examples where the misconception produces different outcomes.

### 3. Micro-practice

Give a very small task designed specifically to challenge the diagnosed misconception.

## Hint ladder

Use four levels:

- **H0:** guiding question
- **H1:** directional hint
- **H2:** conceptual hint
- **H3:** explanation

Do not reveal the complete solution unless the learner explicitly gives up.

Record:

```text
solution_revealed = true
```

---

# 10. Reassessment

Reassessment must test learning rather than only answer recall.

## Levels

### Direct

Same concept, changed surface details.

### Reasoning

Learner explains or predicts behavior.

### Transfer

Learner applies the concept in a new context.

The exact question can change while preserving the misconception target.

## Correct-answer trap

A correct answer does not automatically mean the misconception is resolved.

Example:

A learner previously believes that `range(n)` includes `n`.

They later answer a question correctly because they memorized the expected output.

Re:Learn should seek additional evidence before declaring resolution.

---

# 11. Resolution State Machine

```text
UNKNOWN
   ↓
SUSPECTED
   ↓
DIAGNOSED
   ↓
INTERVENTION
   ↓
IMPROVING
   ├──────────────→ PERSISTENT
   ↓
LIKELY_RESOLVED
   ↓
RETENTION_CHECK
   ↓
VERIFIED_RESOLVED

Any state may → REAPPEARED
```

## Resolution evidence dimensions

Resolution should track three distinct dimensions:

| Dimension | Question |
|---|---|
| Immediate | Can the learner perform the skill now? |
| Transfer | Can the learner apply it in a different context or format? |
| Retention | Can the learner still perform it after a delay? |

A successful immediate answer should move the state toward `LIKELY_RESOLVED`, not directly to `VERIFIED_RESOLVED`.

## MVP resolution rule

A learner may reach `LIKELY_RESOLVED` after:

- at least one post-intervention success
- no immediate contradiction
- evidence consistent with the targeted misconception being weaker

`VERIFIED_RESOLVED` requires a strict evidence bar:

- post-intervention success
- two independent assessment items in different formats
- at least one reasoning or trace-based evidence item
- retention check
- no contradictory evidence

For the hackathon demo, do not pretend that a misconception was verified within a few minutes if verification actually requires delayed retention.

Preferred demo language:

> Likely resolved. Retention verification pending.

If a seeded demo simulates the later retention check, label it clearly as simulated/demo data.

---

# 12. Learner Model

The learner model stores:

- concept mastery
- misconception persistence
- attempts
- recurrence
- last verified state
- evidence history
- intervention history
- reassessment results

## BKT-style mastery

BKT-style modeling may be used for concept mastery:

```text
P(L0) = initial knowledge
P(T)  = probability of learning
P(S)  = slip
P(G)  = guess
```

Do not use plain BKT as the misconception engine.

Keep these states separate:

```text
Concept mastery probability
Misconception persistence probability
```

This prevents a correct answer caused by guessing or memorization from being treated as proof that a misconception disappeared.

## Resolution implementation

The resolution state machine must be a pure TypeScript function in `lib/learner`.

Use incremental state updates:

```text
current misconception state
        +
new learning event
        ↓
applyEvidence(...)
        ↓
updated misconception state
```

Do not recompute the complete learner history on every attempt.

The same deterministic function must be usable by:

- the application API
- automated tests
- evaluation scripts
- offline demo mode

Do not move the core resolution logic into database webhooks or an Edge Function in the MVP.

---

# 13. Question Bank

## 13.1 QuestionSpec contract

Each controlled learning question should carry diagnostic metadata rather than only prompt text.

Recommended structure:

```ts
type QuestionSpec = {
  id: string;
  concept: string;
  expectedBehavior: ExpectedBehavior;
  misconceptionTargets: string[];
  evidenceRules: EvidenceRule[];
  diagnosticQuestions: string[];
  reassessmentVariants: string[];
  difficulty: number;
};
```

`evidenceRules` are authored learning-design rules. They define which observations are diagnostically meaningful for that question and prevent the AI from having to rediscover the intended diagnostic logic.


Questions are controlled assets.

Each question should include:

```ts
{
  id,
  concept,
  difficulty,
  questionType,
  targets,
  distinguishes,
  requiresReasoning,
  reassessmentLevel,
  parameterizedVariants
}
```

For MVP:

- hand-author questions
- use parameterized variants
- do not generate question variants with AI

AI-generated question generation can be added after evaluation shows a need for it.

---

# 13.5 Execution Contract — MVP Hardening

The Pyodide worker is the primary execution path for the MVP.

## Worker responsibilities

The dedicated worker must support:

```text
RUN_CODE
PARSE_AST
RUN_TESTS
TRACE_EXECUTION
HEALTH_CHECK
```

The worker must return a structured result rather than raw stdout:

```ts
type ExecutionResult = {
  status: "SUCCESS" | "ERROR" | "TIMEOUT";
  stdout: string;
  stderr: string;
  errorType: string | null;
  errorLine: number | null;
  traceEvents: TraceEvent[];
  astEvidence: AstEvidence[];
};
```

## Timeout and restart

Student code is untrusted and may contain infinite loops.

Requirements:

- execution timeout
- worker termination on timeout
- worker restart after termination
- deterministic timeout evidence
- UI state recovery after worker restart

## Pyodide assets

For the MVP:

- self-host Pyodide under `public/pyodide`
- use immutable cache headers
- preload when the learner enters the problem workspace
- do not preload on the landing page unless the demo requires it
- do not load Pandas or NumPy

A meaningful loading state must be shown:

> Preparing Python environment…

## Server-side verification

The MVP does not select a server sandbox vendor.

Use:

```ts
interface CodeVerifier {
  verify(input: {
    code: string;
    tests: TestCase[];
    timeoutMs: number;
  }): Promise<VerificationResult>;
}
```

Initial implementation:

```text
MockCodeVerifier
PyodideWorkerCodeVerifier
```

Future implementations may include:

```text
Judge0CodeVerifier
E2BCodeVerifier
ModalCodeVerifier
```

The application must not depend on any specific provider.

---

# 14. Code Intelligence

## Python AST

Use Python's `ast` module exclusively for the Python-only MVP.

Do not add Tree-sitter to the MVP. `ast.parse()` may fail for syntactically invalid code; syntax errors are handled deterministically rather than routed into misconception diagnosis.

Potential evidence:

- indexing operation
- comparison structure
- return statement
- assignment structure
- loop boundaries
- function calls

## Controlled tracing

Use selective tracing/instrumentation when runtime evidence is needed.

Example evidence:

> attempted index 3 on a list of length 3

Tracing must be used selectively because it adds runtime complexity.

## Execution

Primary MVP execution:

```text
Monaco
  ↓
Web Worker
  ↓
Pyodide
  ↓
Python execution
  ↓
Output / tests / evidence
```

Pyodide is loaded in the worker and should be preloaded as early as practical after the student reaches the learning experience. Runtime assets should be self-hosted under `/public` with immutable cache headers for the MVP.

Do not preload Pandas, NumPy, or other heavy packages. They are outside the introductory-programming MVP and should be loaded only if a later curriculum explicitly requires them.

Client-side execution is not authoritative because client state can be modified.

### Server Verification Interface

Do not choose a server sandbox provider in the MVP specification.

Define a provider-independent interface:

```ts
interface CodeVerifier {
  verify(input: {
    code: string;
    tests: TestCase[];
    timeoutMs: number;
  }): Promise<VerificationResult>;
}
```

Initial implementations may include:

```text
CodeVerifier
├── MockCodeVerifier       ← MVP/demo
├── Judge0CodeVerifier     ← optional
├── E2BCodeVerifier        ← future
└── ModalCodeVerifier      ← future
```

The rest of Re:Learn must depend only on `CodeVerifier`, not on a specific sandbox vendor.

Never execute untrusted student code directly inside the application server process.

---

# 15. AI Gateway

Use Vercel AI SDK or an equivalent provider abstraction.

Use:

- one primary model
- one fallback model

Do not tune three providers simultaneously during the MVP.

## Structured AI output

Use the current AI SDK structured-output pattern:

```ts
generateText({
  model,
  output: Output.object({
    schema: DiagnosisSchema
  })
})
```

Do not use manual JSON parsing. Treat `NoObjectGeneratedError` as an AI-unavailable/retry path.

Schemas must enforce:

- known taxonomy IDs
- `OTHER` as the only novel candidate
- explicit `abstain` status
- valid intervention types

Prompt instructions do not replace schema validation.

## AI observability

Core MVP observability remains the `ai_runs` table.

Langfuse is optional and should be added after the first vertical slice. When enabled with AI SDK 7, use the Langfuse OpenTelemetry integration rather than manually wrapping every AI call. Keep the application functional without Langfuse so offline demos and evaluation scripts remain independent of the service.

## AI responsibilities

LLM may handle:

- free-form code interpretation
- reasoning interpretation
- candidate misconception proposal
- intervention wording
- diagnostic-question wording

LLM should not control:

- taxonomy ID creation
- deterministic grading
- application state transitions
- security decisions
- authoritative execution

## Structured output

All AI responses must validate against Zod schemas.

The model must be able to abstain.

Invented taxonomy IDs must be rejected.

---

# 16. AI Safety and Input Handling

Student code, explanations, and text are untrusted input.

Requirements:

- system instructions must remain authoritative
- validate structured output
- reject unknown taxonomy IDs
- allow abstention
- isolate provider-specific code
- apply rate limits and cost limits
- avoid sending unnecessary personal information to model providers
- log important AI calls

Privacy note:

Student code and reasoning may be sent to third-party model APIs. The product should communicate this clearly and redact unnecessary identifiers.

---

# 17. Evaluation

Evaluation is mandatory.

## 17.1 Gold set

Initial target:

**80–110 hand-verified examples**

Recommended split:

- 50–70 development examples
- 30–40 held-out test examples

Include:

- true misconceptions
- correct answers
- syntax errors
- runtime errors
- careless mistakes
- ambiguous cases
- correct answer + wrong reasoning
- confusable misconception pairs

A practical generation method is:

1. seed examples from a known misconception
2. generate variations
3. hand verify every label
4. freeze a held-out test set

External datasets may be used only after checking licensing and scope.

## 17.2 Required metrics

### Diagnosis

- diagnosis accuracy
- Macro-F1
- confusion-pair accuracy
- abstention quality
- unsupported diagnosis rate

### Evidence

- evidence relevance
- evidence contradiction rate

### Intervention

- intervention targetedness
- hint leakage

### Learning

- resolution accuracy
- transfer success
- recurrence detection

### Engineering

- latency
- model cost
- failure rate

---

# Evaluation Harness

Evaluation must be executable from the repository, not only described in documentation.

Recommended scripts:

```text
scripts/
  evaluate-baseline.ts
  evaluate-pipeline.ts
  generate-metrics.ts
```

Recommended data:

```text
data/
  eval/
    development.jsonl
    heldout.jsonl
```

The held-out set must remain untouched by prompt/taxonomy tuning.

Minimum reported metrics:

- overall diagnosis accuracy
- Macro-F1
- confusion-pair accuracy
- abstention rate
- unsupported-diagnosis rate
- confidence intervals where appropriate

The report must compare:

```text
One-shot LLM baseline
vs
Full Re:Learn pipeline
```

Do not fabricate results.

---

# 18. Baseline and Ablation

This is required to demonstrate that Re:Learn is more than a one-shot LLM wrapper.

## Baseline

```text
Question + student answer/code
        ↓
One-shot LLM
        ↓
Diagnosis
```

## Re:Learn

```text
Question
+ answer
+ reasoning
+ execution
+ AST/tracing
+ history
        ↓
Evidence engine
        ↓
Candidate generation
        ↓
Differential diagnosis
        ↓
Diagnostic question when needed
        ↓
Intervention
        ↓
Reassessment
```

Compare at minimum:

| System | Diagnosis Accuracy | Confusion Accuracy | Abstention Quality |
|---|---:|---:|---:|
| One-shot LLM baseline | measured | measured | measured |
| Re:Learn pipeline | measured | measured | measured |

Do not fabricate results. Populate this table only after running the evaluation.

---

# 19. Simulated Learners

Create simulated learners for deterministic demo and evaluation.

Examples:

- learner who believes `range(n)` includes `n`
- learner who believes the first list index is `1`
- learner with correct knowledge but careless mistakes

Clearly label these results:

> Simulated learner evaluation

Do not present simulation results as evidence of real learner improvement.

If possible, collect qualitative feedback from 3–5 real users during the hackathon.

---

# 20. Offline Demo Mode

The demo must not depend entirely on live model/API availability.

Environment:

```text
DEMO_MODE=true
```

Demo mode should provide:

- seeded learner
- seeded questions
- cached AI outputs
- deterministic execution results
- predictable diagnosis flow
- simulated retention verification when needed

Any simulated state must be visibly labeled.

---

# 21. Hero Demo

The strongest demonstration is the **correct-answer / wrong-reasoning trap**.

Example:

1. Student gives a correct answer.
2. Student's reasoning reveals an incorrect belief.
3. Re:Learn does not mark the learner as fully mastered.
4. It identifies the suspected misconception.
5. It provides targeted intervention.
6. It asks a new-context reassessment.
7. It records `LIKELY_RESOLVED`.
8. A retention check remains pending.
9. Later evidence can move the learner to `VERIFIED_RESOLVED` or `REAPPEARED`.

This demonstrates why misconception-aware tutoring differs from ordinary answer checking.

---

# 22. Database — MVP

Keep the MVP database small.

### Required tables

1. `profiles`
2. `questions`
3. `attempts`
4. `evidence`
5. `diagnoses`
6. `interventions`
7. `reassessments`
8. `events`
9. `ai_runs`

Defer unless required:

- `question_variants`
- `transfer_tests`
- `mastery_events`
- `evaluation_results`

---

# 23. API Surface

```text
POST /api/attempts
POST /api/execution
POST /api/diagnosis
POST /api/diagnosis/verify
POST /api/intervention
POST /api/reassessment

GET  /api/learner/:id
GET  /api/recommendations/next

POST /api/tutor/review
GET  /api/evaluation
```

Use shared Zod contracts between:

- frontend
- backend
- AI gateway
- evaluation scripts

---

# 23.5 Environment and Contract Validation

Environment variables must be validated at startup using Zod.

Example:

```ts
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  DEMO_MODE: z.coerce.boolean().default(false),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
});
```

All domain boundaries should use shared Zod contracts.

Required contracts:

```text
AttemptSchema
EvidenceSchema
DiagnosisSchema
InterventionSchema
ReassessmentSchema
LearnerStateSchema
ResolutionStateSchema
CodeVerificationRequestSchema
CodeVerificationResultSchema
AiRunSchema
```

AI taxonomy enforcement must be structural:

```ts
const TaxonomyIdSchema = z.enum([
  "M01",
  "M02",
  "M03",
  "M04",
  "M05",
  "OTHER",
]);
```

Diagnosis must explicitly support abstention.

# 24. Shared Contracts

Required schemas:

```text
AttemptSchema
EvidenceSchema
DiagnosisSchema
InterventionSchema
ReassessmentSchema
LearnerStateSchema
```

These contracts are the boundary between UI, domain logic, persistence, and AI.

---

# 25. Tutor Interface

Tutor/reviewer functionality should expose:

- learner attempt
- observed evidence
- candidate misconceptions
- diagnosis decision
- intervention
- reassessment
- state transitions
- AI trace

## Defer

Do not build these tutor actions in the MVP:

- Modify
- Request another diagnosis

A reviewer can still inspect the diagnostic trail.

---

# 26. Observability

Core MVP observability:

```text
ai_runs
```

Record:

- provider
- model
- prompt/version identifier
- latency
- token/cost metadata where available
- structured result
- validation result
- error
- associated attempt

Optional later:

- Langfuse
- Promptfoo

The MVP must not depend on either.

---

# 26.5 Deferred Infrastructure Decisions

The MVP deliberately does not commit to a managed execution provider.

- E2B, Modal, and Judge0 are interchangeable future `CodeVerifier` implementations.
- Cloudflare is not required for MVP asset delivery.
- Vercel CDN/static delivery plus self-hosted Pyodide assets are sufficient for the initial implementation.
- Render is not used as an untrusted-code execution service.
- Langfuse is optional and must not become a core runtime dependency.

---

# 27. UX / Design System

## Design language

- modern
- editorial
- technical
- minimal
- calm
- precise
- motion-led

Avoid:

- generic AI SaaS gradients
- excessive glow
- random 3D elements
- decorative bento layouts
- excessive dashboards

## Stack

- Next.js
- Tailwind CSS
- shadcn/ui
- Motion
- Lucide
- Recharts
- Monaco

Monaco is acceptable for the desktop-first hackathon MVP. A lighter editor such as CodeMirror can be considered later if mobile becomes a priority.

## Motion

Motion should communicate state changes:

- diagnosing
- evidence appearing
- intervention
- reassessment
- mastery changes

Respect reduced-motion preferences.

The AI should feel invisible. Intelligence should be experienced through behavior, not an artificial “AI brain” interface.

---

# 28. Student Information Architecture

```text
Dashboard
├── Recommended
├── Practice
├── Review
└── Progress

Problem Workspace
Diagnosis
Intervention
Reassessment
Progress
```

## Problem Workspace

- question
- code editor
- output/test panel
- Run
- Submit
- optional reasoning/structured trace
- loading state
- error state

## Diagnosis

Avoid generic:

> Wrong answer.

Prefer:

> We found something interesting.

Then show evidence and the suspected misconception only when sufficiently supported.

---

# 29. Repository Structure

```text
relearn/
├── app/
│   ├── (auth)/
│   ├── student/
│   ├── tutor/
│   └── api/
├── components/
│   ├── ui/
│   ├── motion/
│   ├── code/
│   ├── diagnosis/
│   ├── intervention/
│   ├── reassessment/
│   ├── learner/
│   └── tutor/
├── lib/
│   ├── ai/
│   ├── diagnosis/
│   ├── evidence/
│   ├── assessment/
│   ├── learner/
│   ├── recommendations/
│   ├── execution/
│   └── observability/
├── data/
├── db/
├── contracts/
├── types/
├── data/
│   ├── questions/
│   ├── taxonomy/
│   ├── confusion-sets/
│   └── eval/
├── docs/
├── scripts/
├── tests/
├── public/
│   └── pyodide/
├── AGENTS.md
└── README.md
```

---

# 30. Implementation Phases

## Phase 0 — Foundation

Build only:

- Next.js App Router
- TypeScript
- Tailwind
- shadcn/ui
- Motion
- Lucide
- Supabase configuration
- Zod/shared contracts
- environment configuration
- repository structure
- app shell
- student/tutor route skeleton
- loading/error/not-found foundations
- README
- architecture docs
- AGENTS.md

Do not build diagnosis or code execution in this phase.

## Phase 1 — First Vertical Slice

Implement exactly one misconception:

**M02 — first list index is 1**

Flow:

```text
Question
→ Monaco
→ Pyodide Web Worker
→ deterministic grading/evidence
→ diagnosis
→ intervention
→ reassessment
→ resolution
→ learner state
```

Use mocked diagnosis only if necessary during early integration, but preserve the final interfaces.

Judge0 remains optional for authoritative verification.

Do not add additional misconceptions until this vertical slice works end-to-end.


Do not add M01 (`range(n)` includes `n`) until this vertical slice is stable.

## Phase 2 — Evidence and Differential Diagnosis

Add:

- evidence storage
- AST analysis
- controlled tracing
- confusion sets
- diagnostic questions
- weighted candidate scoring
- abstention

## Phase 3 — Intervention and Reassessment

Add:

- refutation
- contrastive examples
- micro-practice
- direct assessment
- reasoning assessment
- transfer assessment
- resolution state machine

## Phase 4 — Learner Model

Add:

- concept mastery
- misconception persistence
- recurrence
- recommendation logic
- BKT-style mastery update if justified by evaluation

## Phase 5 — Evaluation

Build:

- gold set
- baseline
- ablation
- metrics
- simulated learners
- evaluation dashboard/report

## Phase 6 — Demo and Polish

Add:

- offline demo
- hero flow
- motion design
- tutor review
- performance tuning
- accessibility
- documentation

---

# 31. Definition of Done

Re:Learn MVP is complete when:

### Learning system

- [ ] observes answer/code
- [ ] collects deterministic evidence
- [ ] identifies candidate misconceptions
- [ ] differentiates at least one confusion pair
- [ ] can abstain
- [ ] gives targeted intervention
- [ ] reassesses in a new context
- [ ] distinguishes likely resolution from verified resolution
- [ ] tracks recurrence

### Engineering

- [ ] no direct server execution of student code
- [ ] Pyodide execution is isolated in a Web Worker
- [ ] optional Judge0 verification works
- [ ] Zod contracts are shared
- [ ] AI calls are traceable
- [ ] demo mode works without live AI

### Evaluation

- [ ] gold set exists
- [ ] held-out test set exists
- [ ] one-shot baseline exists
- [ ] Re:Learn pipeline evaluation exists
- [ ] metrics are reported
- [ ] no fabricated evaluation results

### UX

- [ ] student flow is understandable
- [ ] diagnosis is evidence-backed
- [ ] correct-answer trap is demonstrated
- [ ] resolution is not falsely claimed
- [ ] reduced motion is supported

---

# 32. Antigravity Agent Rules

The repository must contain a short `AGENTS.md`.

Critical rules:

1. Read `AGENTS.md` before changing architecture.
2. Do not introduce dependencies when existing dependencies solve the problem.
3. Use shadcn/ui for UI primitives.
4. Use Motion only for meaningful state communication.
5. Never execute student code directly in the application server process.
6. Student input is untrusted.
7. LLMs cannot invent permanent taxonomy IDs.
8. Correct answers alone never prove misconception resolution.
9. Do not produce high-confidence diagnosis without evidence.
10. Use shared Zod contracts.
11. Keep provider-specific AI code behind the AI gateway.
12. Trace important AI calls.
13. Keep domain logic separate from UI.
14. Test diagnosis and resolution logic.
15. Preserve accessibility and reduced-motion behavior.
16. Preserve offline demo mode.
17. Do not turn Re:Learn into a generic chatbot.
18. Keep modules independently understandable for teammates.
19. Deterministic grading comes before AI interpretation where possible.
20. Prefer evidence collection over unsupported inference.
21. Do not show raw model confidence percentages to learners.
22. Allow diagnosis abstention.
23. Keep simulated learner results explicitly labeled.
24. Do not claim delayed retention verification happened unless it actually happened or the UI clearly labels it as simulated.
25. Do not add new misconceptions until the first vertical slice is working.

---

# 33. First Antigravity Prompt

```text
Read AGENTS.md and implement Phase 0 only.

Create the Re:Learn foundation using:
- Next.js App Router
- TypeScript
- Tailwind
- shadcn/ui
- Motion
- Lucide
- Supabase configuration
- Zod shared contracts

Create:
- student route skeleton
- tutor route skeleton
- API route skeleton
- loading/error/not-found foundations
- domain/service folder structure
- initial shared schemas
- environment configuration
- README
- architecture documentation
- AGENTS.md

Do NOT implement:
- diagnosis
- AI prompts
- database migrations
- code execution
- Pyodide
- Judge0
- misconception logic

Keep the architecture ready for Phase 1.

Run:
- typecheck
- lint
- build

Report every issue and fix only Phase 0 issues.
```

---

# 34. First Vertical Slice Prompt

After Phase 0 is stable:

```text
Implement Phase 1 only.

Target exactly one misconception:
M02 — first list index is 1.

Build this complete flow:

Question
→ Monaco
→ Pyodide Web Worker
→ deterministic grading/evidence
→ diagnosis
→ intervention
→ reassessment
→ resolution
→ learner state

Requirements:
- never execute student code directly on the Next.js server
- use deterministic evidence before AI interpretation
- preserve shared Zod contracts
- allow diagnosis abstention
- do not expose raw model confidence percentages
- do not claim VERIFIED_RESOLVED immediately
- use LIKELY_RESOLVED + retention verification pending
- Judge0 is optional and may be stubbed behind an interface
- keep the UI desktop-first and motion-led
- keep the domain logic independent of React components

Do not add additional misconceptions.

Run typecheck, lint, tests, and build.
```

---

# 35. Evaluation Dataset Size

Use approximately 80–110 total hand-verified examples.

Recommended split:

- 50–70 development examples
- 30–40 held-out test examples

Report:

- overall diagnosis accuracy
- Macro-F1
- confusion-pair accuracy
- abstention / unsupported-diagnosis rate
- confidence intervals where sample size permits

Do not fabricate evaluation results.

---

# 36. Team Parallelization

Once Phase 1 is stable, parallelize by module:

### Track A — Frontend

- student dashboard
- problem workspace
- diagnosis
- intervention
- reassessment
- progress

### Track B — Evidence

- AST
- execution adapter
- deterministic grading
- evidence schema
- trace generation

### Track C — Diagnosis

- taxonomy
- confusion sets
- candidate scoring
- diagnostic question selection
- abstention

### Track D — Learning Model

- resolution state machine
- mastery
- misconception persistence
- recommendations

### Track E — Evaluation

- gold set
- baseline
- ablation
- metrics
- simulated learners

All tracks consume shared contracts rather than directly coupling to one another.

---

# 37. Final Product Principle

Re:Learn should demonstrate a learning-science loop rather than a chatbot loop.

The central distinction is:

```text
Ordinary tutor:
Question → Answer → Correct/Incorrect → Explanation

Re:Learn:
Question
→ Observe how the learner thinks
→ Gather evidence
→ Diagnose the misconception
→ Distinguish similar misconceptions
→ Intervene specifically
→ Reassess in a new context
→ Check whether the misconception persists
→ Update the learner model
→ Choose what to teach next
```

The product succeeds when it can show, with evidence and evaluation, that it is diagnosing and responding to misconceptions rather than merely generating explanations.


# 40. V4.2 Implementation Priorities

If implementation time is limited, prioritize in this order:

1. Harden the Pyodide worker.
2. Build deterministic M02 evidence rules.
3. Make offline/demo mode deterministic.
4. Enforce Zod contracts everywhere.
5. Build the evaluation harness early.

The MVP should remain:

```text
One misconception: M02
One execution path: Pyodide worker
One diagnosis style: evidence-first scoring
One AI pattern: structured output + abstention
One resolution target: LIKELY_RESOLVED before retention
One demo guarantee: offline-capable and visibly labeled
One evaluation proof: baseline vs Re:Learn on held-out examples
```
