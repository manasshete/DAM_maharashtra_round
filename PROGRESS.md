# Re:Learn Project Progress Report

This document outlines all the implementation phases and features we have completed for the Re:Learn project up to the current milestone.

---

## 🎯 Phase 0: Foundation & Sandbox
- **Project Scaffolding:** Set up the Next.js App Router project with TypeScript and strict configurations.
- **Safe Code Execution:** Built a deterministic Python sandbox using Pyodide inside a Web Worker (`lib/execution/PyodideWorker.ts`). This allows safe, client-side execution of student code without server-side vulnerabilities.
- **Model Scaffolding:** Created the initial `NaiveBayesClassifier` abstraction for the Misconception Model (`lib/diagnosis/model/classifier.ts`) alongside the evaluation and training scripts.

---

## 🔍 Phase 1A & 1B: Evidence Engine & Differential Diagnosis
- **Evidence Extraction:** Built the deterministic evidence extractor (`lib/evidence/extractor.ts`) capable of pulling features from:
  - AST patterns (e.g., `items[1]`).
  - Execution stdout/stderr.
  - Learner reasoning traces.
- **M02 Question Spec:** Defined the specifications and deterministic evidence rules for misconception **M02 ("The first list index is 1")**.
- **Differential Diagnosis Engine:** Implemented the core diagnostic logic (`lib/diagnosis/differential.ts`) with strict guardrails:
  - **No LLM Diagnostics:** The LLM is prohibited from classifying or inventing misconception IDs.
  - **ABSTAIN Guardrails:** The system explicitly abstains if the confidence is too low or if a single weak piece of evidence (like an AST pattern alone) triggers the model.
- **AI Gateway:** Implemented a strict AI gateway wrapper using `@ai-sdk/core` to translate raw deterministic diagnosis results into friendly explanations.
- **Tests:** Wrote and passed 8 comprehensive unit tests for the diagnostic pipeline.

---

## 🛠️ Phase 1C: Intervention & Adaptive Reassessment
- **Intervention Engine:** Created a strict deterministic policy engine (`lib/intervention/engine.ts`) supporting 4 distinct intervention levels:
  - Level 1: Targeted Hint
  - Level 2: Conceptual Explanation
  - Level 3: Worked Example / Contrast
  - Level 4: Guided Practice
- **Reassessment Variants:** Defined direct, transfer, and reasoning reassessment tasks for M02 to accurately measure conceptual mastery.
- **Correct-Answer Trap:** Engineered the reassessment evaluator (`lib/learner/reassessment.ts`) to intercept false positives—meaning a correct code output but incorrect reasoning trace triggers a failure rather than incorrectly marking the misconception as resolved.
- **UI Scaffold:** Built the initial full-flow React interface (`components/ReassessmentUI.tsx`) connecting the Pyodide worker to the differential diagnosis and intervention engines.

---

## 💾 Phase 1D: Learner State & Persistence
- **Strict Resolution State Machine:** Expanded `lib/learner/resolution.ts` to independently track:
  - Immediate evidence
  - Transfer evidence
  - Reasoning evidence
- **Verified Resolved Criteria:** Enforced the strict rule that a single successful reassessment does **not** grant `VERIFIED_RESOLVED`. It requires a successful transfer task paired with correct conceptual reasoning.
- **Database Layer (Supabase):** Built the persistence client (`lib/db/client.ts`) for persisting raw attempts, evidence feature vectors, diagnosis logs, intervention logs, and the overarching learner state.
- **DEMO_MODE:** Implemented a robust fallback mode so the application runs fully functional using in-memory mock storage if Supabase credentials are not provided in the environment.
- **State Restoration:** Ensured the Next.js UI automatically pulls down the active learner state on mount, continuing exactly from where they left off (e.g., in `PERSISTENT` or `IMPROVING` states).
- **Tests:** Added 5 rigorous state transition and persistence tests, proving the integrity of the resolution engine and DEMO_MODE.

---

### 🚀 Current Status
The complete end-to-end MVP flow (Observation → Diagnosis → Intervention → Reassessment → Persistence) is successfully implemented, passing all tests, and actively running on the local dev server!

## 📊 Phase 2A, 2B, 2C: Dataset & Robust Guardrails
- **Dataset Generation (2A):** Generated a robust dataset of 145 synthetic examples (101 development, 44 held-out) to train the misconception model more rigorously.
- **Model Evaluation (2B):** Established the Naive Bayes baseline on the full dataset (Accuracy: 61.36%, Macro-F1: 0.4864).
- **Hard Guardrails (2C):** Implemented strict differential guardrails in `lib/diagnosis/differential.ts` for M01, M02, and M03 to ensure weak evidence (e.g., AST items alone) never independently triggers a misconception diagnosis.

---

## 🤖 Phase 2D: Pretrained Code Model Experiment
- **UniXcoder Integration:** Built an experimental pipeline (`ml/unixcoder/`) to fine-tune the `microsoft/unixcoder-base` model on the Re:Learn misconception dataset.
- **Evaluation:** Evaluated the UniXcoder model on the 44 unseen held-out examples.
  - **UniXcoder Results:** Accuracy: 63.64%, Macro-F1: 0.4268.
  - **Findings:** While UniXcoder achieved perfect 1.0 recall for M01, M02, M03, and SYNTAX_ERROR (highly sensitive to reasoning traces), it overfit to majority classes, completely missing minority classes like `RUNTIME_ERROR` and `OTHER_UNKNOWN`.
- **Conclusion:** The experiment confirms the power of semantic representation but validates the architectural decision to retain the Naive Bayes baseline + deterministic Differential guardrails until the dataset is significantly more balanced.
