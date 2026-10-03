# UniXcoder Misconception Experiment

This module contains the Phase 2D experiment to fine-tune `microsoft/unixcoder-base` on the Re:Learn misconception dataset.

## Purpose

The goal is to answer:
*"Does a pretrained code model fine-tuned on our Re:Learn misconception dataset provide better misconception classification than our current Naive Bayes baseline?"*

## Configuration

- **Model:** `microsoft/unixcoder-base`
- **Training split:** 80% of `data/eval/raw_development.jsonl`
- **Validation split:** 20% of `data/eval/raw_development.jsonl`
- **Evaluation:** 100% of the completely held-out `data/eval/raw_held_out.jsonl` (exactly what the Naive Bayes baseline is evaluated against)

## Running the Experiment

To run this experiment locally (ensure you have PyTorch and Transformers installed in a Python environment):

1. **Train and validate the model:**
```bash
python ml/unixcoder/train.py
```
*This will train the model and save the best checkpoint to `ml/unixcoder/checkpoint`.*

2. **Evaluate on the untouched held-out dataset:**
```bash
python ml/unixcoder/evaluate.py
```
*This will generate `results/unixcoder_phase2d.json` containing accuracy, macro-F1, per-class metrics, and the confusion matrix.*

## Input Format Strategy (Leakage Avoided)
To ensure the model learns from the learner evidence and not from shortcuts, we do **not** feed the label into the model, and we do not simply feed the raw source code either. We construct the sequence input as follows:

```text
[QUESTION]
{questionId}

[LEARNER CODE]
{code}

[OBSERVATION]
stdout: {stdout}
stderr: {stderr}

[REASONING]
{reasoning}
```
