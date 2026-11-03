import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "notebooks"))

from pipeline.splits import group_split, random_split, seen_group_fraction  # noqa: E402

GROUPS = ["a"] * 10 + ["b"] * 10 + ["c"] * 10 + ["d"] * 10 + ["e"] * 10


def test_random_split_covers_every_row_once():
    train, test = random_split(50, seed=0)
    assert sorted(train + test) == list(range(50))
    assert len(test) == 10


def test_a_group_never_straddles_the_split():
    train, test = group_split(GROUPS, seed=1)
    train_groups = {GROUPS[i] for i in train}
    test_groups = {GROUPS[i] for i in test}
    assert not train_groups & test_groups
    assert sorted(train + test) == list(range(len(GROUPS)))


def test_every_row_is_accounted_for_across_seeds():
    for seed in range(5):
        train, test = group_split(GROUPS, seed=seed)
        assert sorted(train + test) == list(range(len(GROUPS)))
        assert test


def test_seen_group_fraction_reads_zero_for_a_split_on_that_group():
    train, test = group_split(GROUPS, seed=0)
    assert seen_group_fraction(GROUPS, train, test) == 0.0


def test_seen_group_fraction_counts_overlap():
    groups = ["x", "y", "x", "y"]
    assert seen_group_fraction(groups, [0, 1], [2, 3]) == 1.0
    assert seen_group_fraction(groups, [0], [1]) == 0.0
