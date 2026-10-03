import json
import random
from typing import List, Dict, Any
from torch.utils.data import Dataset
from config import RAW_DEV_PATH, RAW_HELD_OUT_PATH, LABEL_TO_ID, SEED

def format_input(example: Dict[str, Any]) -> str:
    """
    Constructs a clear string representation of learner evidence.
    Avoids data leakage: does not include label, id, direct answers, or questionId.
    """
    rep = "[LEARNER CODE]\n"
    rep += f"{example.get('code', '')}\n\n"
    rep += "[OBSERVATION]\n"
    rep += f"stdout: {example.get('stdout', '')}\n"
    rep += f"stderr: {example.get('stderr', '')}\n\n"
    rep += f"[REASONING]\n{example.get('reasoning', '')}"
    return rep

def load_jsonl(path: str) -> List[Dict[str, Any]]:
    data = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                data.append(json.loads(line))
    return data

class ReLearnDataset(Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __getitem__(self, idx):
        item = {key: val[idx] for key, val in self.encodings.items()}
        item['labels'] = self.labels[idx]
        return item

    def __len__(self):
        return len(self.labels)

def get_train_val_datasets(tokenizer, max_length):
    random.seed(SEED)
    dev_data = load_jsonl(RAW_DEV_PATH)
    random.shuffle(dev_data)

    split_idx = int(len(dev_data) * 0.8)
    train_raw = dev_data[:split_idx]
    val_raw = dev_data[split_idx:]

    train_texts = [format_input(ex) for ex in train_raw]
    train_labels = [LABEL_TO_ID[ex['label']] for ex in train_raw]

    val_texts = [format_input(ex) for ex in val_raw]
    val_labels = [LABEL_TO_ID[ex['label']] for ex in val_raw]

    train_encodings = tokenizer(train_texts, truncation=True, padding=True, max_length=max_length)
    val_encodings = tokenizer(val_texts, truncation=True, padding=True, max_length=max_length)

    train_dataset = ReLearnDataset(train_encodings, train_labels)
    val_dataset = ReLearnDataset(val_encodings, val_labels)

    return train_dataset, val_dataset, len(train_raw), len(val_raw)

def get_held_out_dataset(tokenizer, max_length):
    held_out_raw = load_jsonl(RAW_HELD_OUT_PATH)
    texts = [format_input(ex) for ex in held_out_raw]
    labels = [LABEL_TO_ID[ex['label']] for ex in held_out_raw]

    encodings = tokenizer(texts, truncation=True, padding=True, max_length=max_length)
    dataset = ReLearnDataset(encodings, labels)

    return dataset, labels, len(held_out_raw)
