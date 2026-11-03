"""Train and test partitions, from optimistic to honest.

random_split overstates what the model can do on new chemistry. group_split holds out whole
groups: Murcko scaffolds for a chemical-series split, plant families for a taxonomic one. Which
group you choose is the single biggest lever on the reported score, so the comparison between
them belongs in the results, not in a footnote.
"""

import random


def random_split(n, seed, test_fraction=0.2):
    order = list(range(n))
    random.Random(seed).shuffle(order)
    cut = int(round((1.0 - test_fraction) * n))
    return order[:cut], order[cut:]


def group_split(groups, seed, test_fraction=0.2):
    """Hold out whole groups until the test set reaches test_fraction of the rows.

    groups is one hashable group key per row. Every row of a held-out group goes to test and
    no row of it to train, so a group never straddles the split. Rows with a None group are
    kept in train. Returns (train_indices, test_indices).
    """
    members = {}
    for index, key in enumerate(groups):
        members.setdefault(key, []).append(index)
    keys = [k for k in members if k is not None]
    random.Random(seed).shuffle(keys)
    target = test_fraction * len(groups)
    held = set()
    size = 0
    for key in keys:
        if size >= target:
            break
        held.add(key)
        size += len(members[key])
    test = [i for key in held for i in members[key]]
    train = [i for key, rows in members.items() if key not in held for i in rows]
    return sorted(train), sorted(test)


def seen_group_fraction(groups, train_indices, test_indices, ignore=("none", None)):
    """Share of test rows whose group already appears in train.

    This is the diagnostic that says whether a split is genuinely harder or merely different.
    A taxonomic split that leaves chemical series visible is chemically the easier partition,
    so a lower score on it cannot be explained by unseen chemistry.
    """
    train_groups = {groups[i] for i in train_indices} - set(ignore)
    if not test_indices:
        return 0.0
    seen = sum(1 for i in test_indices if groups[i] in train_groups)
    return seen / len(test_indices)
