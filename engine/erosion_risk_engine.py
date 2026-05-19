"""
Erosion Risk Engine
-------------------
Computes a derived erosion susceptibility level for ARABLE land only.

This is an informational indicator based on:
- Rainfall (mm)
- Slope (%)
- Soil depth class
- Drainage class

NOTE:
- This does NOT influence arability classification
- This does NOT influence ICAR rule evaluation
- This is NOT an erosion prediction model (e.g. USLE)
"""

def compute_erosion_risk(factors):
    # -----------------------
    # Rainfall risk (mm)
    # -----------------------
    rainfall_mm = factors["rainfall_mm"]

    if rainfall_mm < 500:
        rainfall_risk = 0.2
    elif rainfall_mm < 1000:
        rainfall_risk = 0.5
    else:
        rainfall_risk = 0.8

    # -----------------------
    # Slope risk (%)
    # -----------------------
    slope_percent = factors["slope_percent"]

    if slope_percent < 3:
        slope_risk = 0.2
    elif slope_percent < 8:
        slope_risk = 0.4
    elif slope_percent < 15:
        slope_risk = 0.6
    else:
        # <= 33 ensured by arability gate
        slope_risk = 0.8

    # -----------------------
    # Soil depth risk
    # -----------------------
    soil_depth_risk_map = {
        "DEEP": 0.2,
        "MEDIUM": 0.5,
        "SHALLOW": 0.8
    }
    soil_risk = soil_depth_risk_map.get(
        factors["soil_depth"], 0.5
    )

    # -----------------------
    # Drainage risk
    # -----------------------
    drainage_risk_map = {
        "WELL_DRAINED": 0.3,
        "MODERATE": 0.5,
        "POOR": 0.8
    }
    drainage_risk = drainage_risk_map.get(
        factors["drainage"], 0.5
    )

    # -----------------------
    # Weighted aggregation
    # -----------------------
    score = round(
        (0.35 * rainfall_risk) +
        (0.35 * slope_risk) +
        (0.15 * soil_risk) +
        (0.15 * drainage_risk),
        2
    )

    # -----------------------
    # Risk classification
    # -----------------------
    if score < 0.35:
        level = "LOW"
    elif score < 0.6:
        level = "MODERATE"
    else:
        level = "HIGH"

    return {
        "level": level,
        "score": score,
        "method": (
            "Derived susceptibility index based on rainfall (mm), "
            "slope (%), soil depth class, and drainage class"
        )
    }

