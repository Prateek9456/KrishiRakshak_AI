from dataclasses import dataclass

from engine.rule_engine import evaluate_rules


@dataclass
class Factors:
    land_use: str
    rainfall_mm: float
    slope_percent: float
    soil_depth: str
    drainage: str


RULE_FILE = "rules/icar_table_4_1_mechanical_measures.json"


def test_wheat_uses_rainfall_range_and_medium_depth():
    factors = Factors(
        land_use="WHEAT",
        rainfall_mm=900,
        slope_percent=2.5,
        soil_depth="MEDIUM",
        drainage="MODERATE",
    )

    result = evaluate_rules(factors, RULE_FILE)

    assert result["mode"] == "STRICT"
    assert "Contour bunding" in result["measures"]


def test_nearest_recommendation_prevents_empty_measures():
    factors = Factors(
        land_use="WHEAT",
        rainfall_mm=1800,
        slope_percent=18,
        soil_depth="SHALLOW",
        drainage="WELL_DRAINED",
    )

    result = evaluate_rules(factors, RULE_FILE)

    assert result["mode"] in {"RELAXED", "NEAREST"}
    assert len(result["measures"]) > 0
