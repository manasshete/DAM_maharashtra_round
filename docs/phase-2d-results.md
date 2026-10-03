# Phase 2D: Pretrained Code Model Experiment Results

## Overview
This document compares the Naive Bayes baseline against a fine-tuned `microsoft/unixcoder-base` model on the Re:Learn misconception dataset. The models were evaluated on the same 44-example held-out set.

## BASELINE
**Naive Bayes**
- **Accuracy:** 61.36%
- **Macro-F1:** 0.4864

## EXPERIMENT
**UniXcoder**
- **Accuracy:** 63.64%
- **Macro-F1:** 0.4268

## ERROR ANALYSIS

### Correct Predictions
- **UniXcoder** correctly identifies all instances of `M01`, `M02`, `M03`, and `SYNTAX_ERROR` (100% recall on these 4 classes). The rich sequence representation allows it to easily match the semantics of common misconception behaviors.
- **Naive Bayes** correctly captured these as well but had slightly lower recall on some due to relying entirely on deterministic feature overlap.

### M01/M02/M03 Confusions
- **UniXcoder** did not confuse `M01`, `M02`, and `M03` with each other! It perfectly differentiated between them. The context provided by the `[REASONING]` block and `[LEARNER CODE]` was sufficient to separate them perfectly.
- **Naive Bayes** occasionally struggled if the learner used multiple conflicting code constructs (e.g., boundary loops mixed with index references). 

### OTHER_UNKNOWN Errors
- **UniXcoder** completely failed to predict `OTHER_UNKNOWN` (Precision: 0.0, Recall: 0.0). All 6 instances of `OTHER_UNKNOWN` were erroneously classified as `M03`.
- **Naive Bayes** performed better on `OTHER_UNKNOWN` by defaulting when specific M02/M03 features were absent.

### Cases where Reasoning Changed the Diagnosis
- UniXcoder clearly anchored on the `[REASONING]` blocks. For example, `M01` ("Range starts at 1") was flawlessly detected likely due to text like "I should start at 1" in the reasoning, which UniXcoder maps natively as a language model, whereas Naive Bayes requires a hardcoded regex/AST extractor to flag `reasoning_starts_1`.

### Cases where Code Alone was Ambiguous
- For `RUNTIME_ERROR` (e.g., `IndexError`), the code alone can often resemble an `M02` misconception. **UniXcoder** fell into this trap, classifying all 4 `RUNTIME_ERROR` instances and all 4 `CAREFUL_CORRECT` instances as `M02`. It overfit to the `M02` class because `M02` is the most common label in the training set (34/80 examples).

## Conclusion
While **UniXcoder** slightly edges out Naive Bayes in raw **Accuracy (63.64% vs 61.36%)**, it achieves a notably lower **Macro-F1 (0.4268 vs 0.4864)**. This is because UniXcoder overfit to the majority classes (`M02` and `M03`), completely failing to predict minority classes like `RUNTIME_ERROR`, `CAREFUL_CORRECT`, and `OTHER_UNKNOWN`.

**Recommendation:** Do NOT replace the Naive Bayes baseline in production yet. UniXcoder requires either more balanced training data, data augmentation, or a modified loss function (e.g., focal loss / class weights) to avoid collapsing into majority-class predictions.
