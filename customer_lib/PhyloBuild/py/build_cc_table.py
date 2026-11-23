#!/usr/bin/env python3
"""Compute S. aureus clonal complexes from MLST allele profiles.

Uses a BURST-style founder approach (not simple connected components, which
suffer from the chaining problem).  Algorithm:

1. Build the SLV graph (edges between STs differing at exactly 1 of 7 loci).
2. Rank STs by number of SLV connections (most connected first).
3. Process in rank order:
   - If unassigned: this ST becomes a CC founder -> CC{ST}.
     Assign all its direct SLVs (that are still unassigned) to this CC.
   - If already assigned: skip (it was claimed by an earlier founder).
4. Unassigned STs with zero SLVs become singletons (no CC label).

This prevents long chains from merging biologically distinct CCs,
because each ST is assigned to at most one founder and only through
a direct SLV link (not a transitive chain).

Usage: build_cc_table.py <profiles.tsv> <output.tsv>
"""

import sys
from collections import defaultdict


def main():
    profile_path = sys.argv[1]
    output_path = sys.argv[2]

    profiles = {}
    with open(profile_path) as f:
        f.readline()
        for line in f:
            fields = line.strip().split('\t')
            if len(fields) < 8:
                continue
            st = fields[0]
            alleles = tuple(fields[1:8])
            profiles[st] = alleles

    # Build SLV adjacency using wildcard keys (O(n*7) instead of O(n^2))
    key_to_sts = defaultdict(set)
    for st, alleles in profiles.items():
        for i in range(7):
            key = alleles[:i] + ('*',) + alleles[i + 1:]
            key_to_sts[key].add(st)

    adj = defaultdict(set)
    for key, sts in key_to_sts.items():
        sts = list(sts)
        for i in range(len(sts)):
            for j in range(i + 1, len(sts)):
                adj[sts[i]].add(sts[j])
                adj[sts[j]].add(sts[i])

    # Rank STs: most SLV connections first, then lowest ST number for ties
    ranked = sorted(profiles.keys(),
                    key=lambda s: (-len(adj[s]), int(s) if s.isdigit() else 99999))

    cc_map = {}
    for st in ranked:
        if st in cc_map:
            continue
        if not adj[st]:
            continue
        cc_name = 'CC{}'.format(st)
        cc_map[st] = cc_name
        for neighbor in adj[st]:
            if neighbor not in cc_map:
                cc_map[neighbor] = cc_name

    # Singletons get no CC label
    for st in profiles:
        if st not in cc_map:
            cc_map[st] = ''

    with open(output_path, 'w') as f:
        f.write('ST\tclonal_complex\n')
        for st in sorted(cc_map.keys(), key=lambda x: int(x) if x.isdigit() else 0):
            f.write('{}\t{}\n'.format(st, cc_map[st]))

    n_cc = len(set(v for v in cc_map.values() if v))
    n_assigned = sum(1 for v in cc_map.values() if v)
    print('Computed {} CCs covering {} of {} STs'.format(n_cc, n_assigned, len(cc_map)))


if __name__ == '__main__':
    main()
