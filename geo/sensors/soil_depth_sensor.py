# geo/sensors/soil_depth_sensor.py

def fetch_soil_depth_class(slope_percent):
    """
    Returns ICAR soil depth class:
    DEEP / MEDIUM / SHALLOW

    Deterministic, ICAR-consistent physiography proxy.
    Uses slope (%) only. Conservative by design.
    """

    if slope_percent is None:
        # Conservative fallback
        return "SHALLOW"

    # ICAR: flat to very gently sloping alluvial plains
    if slope_percent <= 3.0:
        return "DEEP"

    # ICAR: gently sloping to undulating terrain
    if slope_percent <= 15.0:
        return "MEDIUM"

    # ICAR: dissected / steeper terrain
    return "SHALLOW"
