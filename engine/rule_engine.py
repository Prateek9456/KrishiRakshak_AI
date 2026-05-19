import json


def load_rules(path):
    with open(path, "r") as f:
        return json.load(f)


def rule_matches(rule, factors, ignore_land_use=False):
    slope = factors.slope_percent
    rainfall = factors.rainfall_mm
    soil_depth = factors.soil_depth
    drainage = factors.drainage

    # ---- slope ----
    if "slope_max" in rule and slope > rule["slope_max"]:
        return False
    if "slope_range" in rule:
        lo, hi = rule["slope_range"]
        if not (lo <= slope <= hi):
            return False

    # ---- rainfall ----
    if "rainfall_min" in rule and rainfall < rule["rainfall_min"]:
        return False
    if "rainfall_max" in rule and rainfall > rule["rainfall_max"]:
        return False
    if "rainfall_range" in rule:
        lo, hi = rule["rainfall_range"]
        if not (lo <= rainfall <= hi):
            return False

    # ---- soil depth ----
    if soil_depth not in rule["soil_depth"]:
        return False

    # ---- drainage (optional constraint) ----
    if "drainage" in rule:
        allowed_drainage = rule["drainage"]
        if isinstance(allowed_drainage, str):
            allowed_drainage = [allowed_drainage]
        if drainage not in allowed_drainage:
            return False


    # ---- land use (optional) ----
    if not ignore_land_use:
        if factors.land_use not in rule["land_use"]:
            return False

    return True


def score_rule(rule, factors, ignore_land_use=False):
    score = 0

    if "slope_range" in rule:
        lo, hi = rule["slope_range"]
        if lo <= factors.slope_percent <= hi:
            score += 3
    elif "slope_max" in rule and factors.slope_percent <= rule["slope_max"]:
        score += 3

    if "rainfall_range" in rule:
        lo, hi = rule["rainfall_range"]
        if lo <= factors.rainfall_mm <= hi:
            score += 3
    else:
        if "rainfall_min" in rule and factors.rainfall_mm >= rule["rainfall_min"]:
            score += 2
        if "rainfall_max" in rule and factors.rainfall_mm <= rule["rainfall_max"]:
            score += 2
        if "rainfall_min" not in rule and "rainfall_max" not in rule:
            score += 1

    if factors.soil_depth in rule["soil_depth"]:
        score += 2

    allowed_drainage = rule.get("drainage")
    if allowed_drainage is None:
        score += 1
    else:
        if isinstance(allowed_drainage, str):
            allowed_drainage = [allowed_drainage]
        if factors.drainage in allowed_drainage:
            score += 1

    if ignore_land_use or factors.land_use in rule["land_use"]:
        score += 2

    return score


def evaluate_rules(factors, rule_file):
    rules = load_rules(rule_file)

    # STAGE 1 — strict (with land use)
    strict = [
        r["measure"]
        for r in rules
        if rule_matches(r, factors, ignore_land_use=False)
    ]

    if strict:
        return {
            "mode": "STRICT",
            "measures": strict
        }

    # STAGE 2 — relaxed (ignore land use)
    relaxed = [
        r["measure"]
        for r in rules
        if rule_matches(r, factors, ignore_land_use=True)
    ]

    if relaxed:
        return {
            "mode": "RELAXED",
            "measures": relaxed
        }

    ranked = sorted(
        rules,
        key=lambda r: score_rule(r, factors, ignore_land_use=True),
        reverse=True,
    )
    fallback = []
    for rule in ranked:
        measure = rule["measure"]
        if measure not in fallback:
            fallback.append(measure)
        if len(fallback) == 3:
            break

    return {
        "mode": "NEAREST",
        "measures": fallback
    }
