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

    `ignore` excludes the placeholder groups, chiefly the "none" that murcko_scaffold returns
    for an acyclic molecule, which is an absence of a scaffold rather than a shared one. For a
    group split this makes no difference, because group_split already guarantees a group never
    straddles, so an acyclic test compound implies no acyclic training compound. It matters only
    where groups can straddle, which is the random baseline, and there it understates how much
    the baseline has already seen. Pass ignore=() to measure that.
    """
    train_groups = {groups[i] for i in train_indices} - set(ignore)
    if len(test_indices) == 0:
        return 0.0
    seen = sum(1 for i in test_indices if groups[i] in train_groups)
    return seen / len(test_indices)


def group_split_three(groups, seed, validation_fraction=0.15, test_fraction=0.15):
    """Split group-wise into train, validation and test, so no group straddles a partition."""
    rest, test = group_split(groups, seed, test_fraction)
    rest_groups = [groups[i] for i in rest]
    inner_fraction = validation_fraction / max(1e-9, 1.0 - test_fraction)
    inner_train, inner_validation = group_split(rest_groups, seed + 1000, inner_fraction)
    train = [rest[i] for i in inner_train]
    validation = [rest[i] for i in inner_validation]
    return sorted(train), sorted(validation), sorted(test)


def nearest_similarity(matrix, reference, chunk=3000):
    """Max Tanimoto of each row of matrix to any row of reference."""
    import numpy as np

    best = np.zeros(len(matrix))
    for start in range(0, len(reference), chunk):
        block = reference[start:start + chunk]
        inter = matrix @ block.T
        union = matrix.sum(1)[:, None] + block.sum(1)[None, :] - inter
        best = np.maximum(best, (inter / np.maximum(union, 1)).max(axis=1))
    return best


def distance_matched_split(matrix, groups, seed, validation_fraction=0.15, test_fraction=0.15,
                           reference_size=4000):
    """Train/validation/test where validation is the chemistry furthest from the rest.

    Tuning on a validation set full of near-twins of the training data selects a model that
    memorises, because memorising wins there. If the deployment population sits much further
    away, that choice is made in the wrong regime. This builds validation from whole groups
    whose members are least similar to the rest of the pool, so the tuning signal comes from
    the hard regime rather than the easy one.

    Test is drawn at random from the remaining groups, so it keeps the usual scaffold-split
    meaning and stays comparable with earlier runs.
    """
    import numpy as np

    rng = np.random.default_rng(seed)
    reference_index = rng.choice(len(matrix), min(reference_size, len(matrix)), replace=False)
    similarity = nearest_similarity(matrix, matrix[reference_index])

    members = {}
    for index, key in enumerate(groups):
        members.setdefault(key, []).append(index)

    scored = []
    for key, rows in members.items():
        if key in ("none", None):
            continue
        scored.append((float(np.median(similarity[rows])), key, len(rows)))
    scored.sort()

    target = validation_fraction * len(matrix)
    validation_keys, taken = set(), 0
    for _, key, size in scored:
        if taken >= target:
            break
        validation_keys.add(key)
        taken += size

    rest = [k for k in members if k not in validation_keys]
    rng.shuffle(rest)
    test_target = test_fraction * len(matrix)
    test_keys, taken = set(), 0
    for key in rest:
        if taken >= test_target:
            break
        if key in ("none", None):
            continue
        test_keys.add(key)
        taken += len(members[key])

    validation, test, train = [], [], []
    for key, rows in members.items():
        if key in validation_keys:
            validation.extend(rows)
        elif key in test_keys:
            test.extend(rows)
        else:
            train.extend(rows)
    return sorted(train), sorted(validation), sorted(test), similarity
