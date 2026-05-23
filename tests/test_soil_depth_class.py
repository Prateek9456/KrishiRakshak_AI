from geo.sensors.soil_depth_sensor import fetch_soil_depth_class


def test_soil_depth_uses_icar_slope_thresholds():
    assert fetch_soil_depth_class(2.0) == "DEEP"
    assert fetch_soil_depth_class(3.0) == "DEEP"
    assert fetch_soil_depth_class(4.0) == "MEDIUM"
    assert fetch_soil_depth_class(15.0) == "MEDIUM"
    assert fetch_soil_depth_class(18.0) == "SHALLOW"


def test_soil_depth_uses_conservative_fallback():
    assert fetch_soil_depth_class(None) == "SHALLOW"
