import os
from flask import Flask, request, jsonify

print("🚀 APP STARTED")

# --------------------------------------------------
# Runtime bootstrap for GeoTIFF landcover data
# --------------------------------------------------
from geo.bootstrap_landcover import ensure_landcover_data

print("📡 STARTING LANDCOVER BOOTSTRAP")

ensure_landcover_data()

print("✅ LANDCOVER BOOTSTRAP COMPLETE")

# --------------------------------------------------
# Core imports (unchanged logic)
# --------------------------------------------------
from geo.factor_builder import build_factors
from geo.arable_classifier import is_arable_land
from engine.rule_engine import evaluate_rules
from engine.erosion_risk_engine import compute_erosion_risk

print("✅ CORE IMPORTS COMPLETE")

RULES_FILE = "rules/icar_table_4_1_mechanical_measures.json"

app = Flask(__name__)

print("✅ FLASK APP CREATED")


# --------------------------------------------------
# Health check (does NOT trigger raster logic)
# --------------------------------------------------
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"}), 200


# --------------------------------------------------
# Main analysis endpoint
# --------------------------------------------------
@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "status": "ERROR",
            "message": "Invalid or missing JSON payload"
        }), 400

    lat = data.get("lat")
    lon = data.get("lon")
    land_use = data.get("land_use")

    if lat is None or lon is None or land_use is None:
        return jsonify({
            "status": "ERROR",
            "message": "lat, lon and land_use are required"
        }), 400

    # -----------------------------
    # Build factors (OBJECT)
    # -----------------------------
    factors = build_factors(
        lat=lat,
        lon=lon,
        land_use=land_use
    )

    # -----------------------------
    # Arability check (EARLY EXIT)
    # -----------------------------
    is_arable, reason = is_arable_land(
        lat=lat,
        lon=lon,
        slope_percent=factors.slope_percent
    )

    if not is_arable:
        return jsonify({
            "status": "NON_ARABLE",
            "message": "System works only for arable agricultural land",
            "reason": reason,
            "input": {
                "lat": lat,
                "lon": lon,
                "land_use": land_use
            }
        }), 200

    # -----------------------------
    # ICAR mechanical rules
    # -----------------------------
    mechanical_measures = evaluate_rules(
        factors=factors,
        rule_file=RULES_FILE
    )

    # -----------------------------
    # Erosion risk (READ-ONLY)
    # -----------------------------
    erosion_risk = compute_erosion_risk({
        "rainfall_mm": factors.rainfall_mm,
        "slope_percent": factors.slope_percent,
        "soil_depth": factors.soil_depth,
        "drainage": factors.drainage
    })

    # -----------------------------
    # Final response (LOCKED FORMAT)
    # -----------------------------
    return jsonify({
        "status": "OK",
        "input": {
            "lat": lat,
            "lon": lon,
            "land_use": land_use
        },
        "factors": {
            "rainfall_mm": factors.rainfall_mm,
            "slope_percent": factors.slope_percent,
            "soil_depth": factors.soil_depth,
            "drainage": factors.drainage,
            "land_use": land_use
        },
        "mechanical_measures": mechanical_measures,
        "erosion_risk": erosion_risk
    }), 200


# --------------------------------------------------
# Render-compatible server start
# --------------------------------------------------
if __name__ == "__main__":
    print("🚀 STARTING FLASK SERVER")

    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 10000))
    )
