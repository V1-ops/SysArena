import csv
import io
import json
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DATASET_DIR = ROOT / "content" / "datasets" / "agents"
MANIFEST_PATH = DATASET_DIR / "manifest.json"


@lru_cache(maxsize=1)
def _manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def list_agent_datasets() -> list[dict]:
    datasets = []
    for item in _manifest().get("datasets", []):
        csv_text = load_agent_dataset_csv(item["id"])
        row_count = max(0, len(csv_text.strip().splitlines()) - 1)
        datasets.append({**item, "rowCount": row_count})
    return datasets


def get_agent_dataset(dataset_id: str) -> dict | None:
    return next((item for item in list_agent_datasets() if item["id"] == dataset_id), None)


def load_agent_dataset_csv(dataset_id: str) -> str:
    item = next((entry for entry in _manifest().get("datasets", []) if entry["id"] == dataset_id), None)
    if not item:
        raise ValueError(f"Unknown dataset: {dataset_id}")
    path = (DATASET_DIR / item["file"]).resolve()
    if DATASET_DIR.resolve() not in path.parents:
        raise ValueError("Invalid dataset path")
    return path.read_text(encoding="utf-8")


def describe_csv(csv_text: str) -> dict:
    reader = csv.DictReader(io.StringIO(csv_text.strip()))
    return {
        "columns": [header.strip() for header in (reader.fieldnames or []) if header and header.strip()],
        "rowCount": sum(1 for _ in reader),
    }
