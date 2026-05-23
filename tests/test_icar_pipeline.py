import os
import sys

# Ensure project root is on path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from geo.factor_builder import build_factors
from engine.rule_engine import evaluate_rules


RULE_FILE = "rules/icar_table_4_1_mechanical_measures.json"


def test_icar_pipeline_basic():
    """
    End-to-end ICAR DSS test.
    """

    factors = build_factors(
        lat=30.3165,
        lon=78.0322,
        land_use="SMALL_MILLETS",
        overrides={
            "rainfall_mm": 900,
            "slope_percent": 10,
            "soil_depth": "SHALLOW",
            "drainage": "POOR",
        },
    )

    assert factors.rainfall_mm == 900
    assert factors.slope_percent == 10
    assert factors.soil_depth == "SHALLOW"
    assert factors.drainage == "POOR"
    assert factors.land_use == "SMALL_MILLETS"

    recommendation = evaluate_rules(factors, RULE_FILE)

    assert recommendation["mode"] in {"STRICT", "RELAXED", "NEAREST"}
    assert recommendation["measures"]
