import os

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "eval")

RAW_DEV_PATH = os.path.join(DATA_DIR, "raw_development.jsonl")
RAW_HELD_OUT_PATH = os.path.join(DATA_DIR, "raw_held_out.jsonl")

CHECKPOINT_DIR = os.path.join(os.path.dirname(__file__), "checkpoint")
RESULTS_PATH = os.path.join(BASE_DIR, "results", "unixcoder_phase2d.json")

# Hyperparameters
MODEL_NAME = "microsoft/unixcoder-base"
SEED = 42
MAX_SEQ_LENGTH = 256
BATCH_SIZE = 8
EPOCHS = 3
LEARNING_RATE = 2e-5

# Label Taxonomy
LABELS = [
    "M01",
    "M02",
    "M03",
    "OTHER_UNKNOWN",
    "CAREFUL_CORRECT",
    "CARELESS_ERROR",
    "SYNTAX_ERROR",
    "RUNTIME_ERROR"
]

LABEL_TO_ID = {label: i for i, label in enumerate(LABELS)}
ID_TO_LABEL = {i: label for i, label in enumerate(LABELS)}
NUM_LABELS = len(LABELS)
