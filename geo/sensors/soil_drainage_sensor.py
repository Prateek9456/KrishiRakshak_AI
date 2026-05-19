def fetch_soil_drainage(slope_percent, rainfall_mm):
    """
    ICAR-aligned soil drainage classification.
    Derived from live slope (%) and live rainfall (mm).
    """

    # High rainfall + flat land → poor drainage
    if rainfall_mm > 2000 and slope_percent < 5:
        return "POOR"

    # Gentle slope → moderate drainage
    if slope_percent < 8:
        return "MODERATE"

    # Sloping land drains well
    return "WELL_DRAINED"
