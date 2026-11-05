import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
INVESTOR_DATA_PATH = PROJECT_ROOT / "data" / "investor.json"


def load_investor_data():
    """Load the fictional investor profile used by the demo."""
    with INVESTOR_DATA_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)
