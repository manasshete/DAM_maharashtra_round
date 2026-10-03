import json
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
from config import CHECKPOINT_DIR, MAX_SEQ_LENGTH, LABELS, ID_TO_LABEL, RESULTS_PATH, MODEL_NAME, SEED, BATCH_SIZE, EPOCHS, LEARNING_RATE
from dataset import get_held_out_dataset, get_train_val_datasets

def main():
    print(f"Loading best model from {CHECKPOINT_DIR}...")
    tokenizer = AutoTokenizer.from_pretrained(CHECKPOINT_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(CHECKPOINT_DIR)

    print("Loading held-out dataset...")
    test_dataset, true_labels, test_size = get_held_out_dataset(tokenizer, MAX_SEQ_LENGTH)
    
    # Just to get sizes for the report
    _, _, train_size, val_size = get_train_val_datasets(tokenizer, MAX_SEQ_LENGTH)

    trainer = Trainer(model=model)
    print("Running predictions...")
    pred_output = trainer.predict(test_dataset)
    preds = pred_output.predictions.argmax(-1)

    acc = accuracy_score(true_labels, preds)
    precision, recall, f1, _ = precision_recall_fscore_support(true_labels, preds, average="macro", zero_division=0)
    
    per_class_p, per_class_r, per_class_f1, _ = precision_recall_fscore_support(true_labels, preds, average=None, labels=range(len(LABELS)), zero_division=0)
    
    conf_matrix = confusion_matrix(true_labels, preds, labels=range(len(LABELS)))

    per_class_results = {}
    for i, label in enumerate(LABELS):
        if np.sum(conf_matrix[i]) > 0: # Only include classes that were present in true labels
            per_class_results[label] = {
                "precision": float(per_class_p[i]),
                "recall": float(per_class_r[i]),
                "f1": float(per_class_f1[i])
            }

    results = {
        "model": MODEL_NAME,
        "model_type": "sequence_classification",
        "dataset_version": "v2",
        "train_size": train_size,
        "validation_size": val_size,
        "held_out_size": test_size,
        "accuracy": float(acc),
        "macro_f1": float(f1),
        "per_class": per_class_results,
        "confusion_matrix": conf_matrix.tolist(),
        "config": {
            "seed": SEED,
            "batch_size": BATCH_SIZE,
            "epochs": EPOCHS,
            "learning_rate": LEARNING_RATE,
            "max_seq_length": MAX_SEQ_LENGTH
        }
    }

    import os
    os.makedirs(os.path.dirname(RESULTS_PATH), exist_ok=True)
    with open(RESULTS_PATH, 'w') as f:
        json.dump(results, f, indent=2)

    print("--- UNIXCODER EXPERIMENT EVALUATION ---")
    print(f"Accuracy: {acc*100:.2f}%")
    print(f"Macro-F1: {f1:.4f}")
    print(f"Results saved to {RESULTS_PATH}")

if __name__ == "__main__":
    main()
