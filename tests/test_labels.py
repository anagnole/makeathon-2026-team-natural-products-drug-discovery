import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "notebooks"))

from pipeline.labels import binary_label, to_micromolar  # noqa: E402


def test_molar_units_convert():
    assert to_micromolar(1, "mM") == pytest.approx(1000.0)
    assert to_micromolar(1, "nM") == pytest.approx(0.001)
    assert to_micromolar(2.5, "uM") == pytest.approx(2.5)


def test_mass_units_need_a_molecular_weight():
    assert to_micromolar(32, "ug.mL-1") is None
    assert to_micromolar(32, "ug.mL-1", 320.0) == pytest.approx(100.0)
    assert to_micromolar(32, "mg/L", 320.0) == pytest.approx(100.0)


def test_unknown_unit_and_bad_value_are_losses_not_guesses():
    assert to_micromolar(32, "ul/ml", 320.0) is None
    assert to_micromolar("n.a.", "uM") is None
    assert to_micromolar(0, "uM") is None
    assert to_micromolar(-5, "uM") is None


def test_active_measurement_wins_over_inactive():
    assert binary_label([("=", 8.0), ("=", 64.0)], 32.0) == 1


def test_censored_above_threshold_is_a_negative():
    assert binary_label([(">", 64.0)], 32.0) == 0
    assert binary_label([(">=", 32.0)], 32.0) == 0


def test_censored_below_threshold_says_nothing():
    assert binary_label([(">", 16.0)], 32.0) is None


def test_exact_value_above_threshold_is_a_negative():
    assert binary_label([("=", 64.0)], 32.0) == 0
