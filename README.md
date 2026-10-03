# Re:Learn 🧠

Re:Learn is an **AI-powered, misconception-aware introductory programming tutor**. Unlike traditional auto-graders that simply mark an answer as "wrong," Re:Learn acts as an intelligent diagnostic system. It analyzes a learner's code, execution behavior, and their underlying reasoning to identify the *exact conceptual misconception* causing the error. It then provides targeted interventions and adaptive reassessments to ensure the misconception is permanently resolved.

## 🌟 Key Features
- **Deterministic Execution Sandbox:** Safely executes student Python code entirely in the browser using WebAssembly (Pyodide).
- **Evidence Extraction:** Deterministically extracts behavioral flags from AST patterns, runtime errors, output sequences, and reasoning traces.
- **Differential Diagnosis Engine:** Combines a trained statistical model (Categorical Naive Bayes) with strict logic guardrails. The system refuses to confidently diagnose a misconception (ABSTAINs) unless there is sufficient corroborating evidence (e.g., behavioral + reasoning).
- **Adaptive Interventions:** Four levels of escalated support: Hint → Explanation → Worked Example → Guided Practice.
- **Strict Resolution Flow:** A single correct answer is not enough. Re:Learn implements a "Correct-Answer Trap," requiring clean direct execution, clean transfer execution, and correct conceptual reasoning before marking a learner as `VERIFIED_RESOLVED`.

## 🏗️ Architecture

```mermaid
flowchart TD
    A([Student: Code + Reasoning]) --> B[Pyodide Web Worker]
    B --> C(Deterministic Evidence Extractor)
    
    subgraph Diagnosis Engine
        C -->|Feature Vector| D{Trained Misconception Model}
        D -->|Candidate Prediction| E[Differential Guardrails]
        E -->|Strict Logic Check| F([DIAGNOSED / ABSTAIN])
    end
    
    F --> G[Targeted Intervention Engine]
    G --> H[Adaptive Reassessment]
    
    subgraph Resolution Model
        H --> I{Correct-Answer Trap Evaluator}
        I -->|Direct + Transfer + Reasoning Passed| J([VERIFIED RESOLVED])
        I -->|Contradictory Reasoning / Repeated Failure| K([PERSISTENT])
    end
    
    J --> L[(Supabase Persistence)]
    K --> L
    
    LLM[LLM API] -.->|Friendly Explanations only| F
    
    style A fill:#e1f5fe,stroke:#01579b
    style F fill:#c8e6c9,stroke:#1b5e20
    style J fill:#c8e6c9,stroke:#1b5e20
    style LLM fill:#fff3e0,stroke:#e65100,stroke-dasharray: 5 5
```

## 🧠 Experimental Pretrained Code Model (Phase 2D)
The system currently relies on a Naive Bayes classifier as the primary baseline, which provides high interpretability and balance across minority classes. In **Phase 2D**, we experimented with fine-tuning a pretrained `microsoft/unixcoder-base` model. While the UniXcoder model proved incredibly powerful at extracting and anchoring on reasoning blocks (achieving 100% recall for core misconceptions), it was prone to majority-class collapse without a significantly larger and more balanced dataset. Therefore, the deterministic baseline model remains the active production diagnostic core.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or pnpm
- (Optional) Supabase credentials for cloud persistence

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/manasshete/DAM_maharashtra_round.git
   cd DAM_maharashtra_round
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

*Note: If no Supabase credentials are provided in `.env.local`, the application will seamlessly default to a local in-memory `DEMO_MODE` for state tracking.*

## 🧪 Testing
The diagnostic engine, intervention pathways, and resolution state machine are heavily tested using `vitest`.
```bash
npx vitest run
```

---
*Built as part of the DAM Maharashtra round.*
