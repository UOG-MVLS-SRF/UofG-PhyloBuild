#!/usr/bin/env python3
"""Look up the clonal complex for a given S. aureus ST from the CC table.

Usage:
  lookup_cc.py <cc_table> <st>                    — look up by ST number
  lookup_cc.py <cc_table> <st> <profiles> <a1> .. <a7>  — if ST is '-', find nearest CC from alleles
"""
import sys


def lookup_cc_by_st(cc_path, st):
    if st in ('-', '', '0', 'Novel', 'failed', 'None'):
        return None
    try:
        st = str(int(st))
    except ValueError:
        return None
    try:
        with open(cc_path) as f:
            header = f.readline().rstrip('\n').split('\t')
            cc_idx = None
            for i, col in enumerate(header):
                if 'clonal_complex' in col.lower() or col.lower() == 'cc':
                    cc_idx = i
                    break
            if cc_idx is None:
                return 'ST' + st
            for line in f:
                fields = line.rstrip('\n').split('\t')
                if len(fields) > cc_idx and fields[0] == st:
                    cc = fields[cc_idx].strip()
                    if cc and cc not in ('', '-', 'NA'):
                        return cc
                    return 'ST' + st
    except (IOError, IndexError):
        pass
    return 'ST' + st


def lookup_cc_by_alleles(cc_path, profiles_path, alleles):
    """Find the CC of the nearest known ST by allele similarity."""
    profiles = {}
    try:
        with open(profiles_path) as f:
            f.readline()
            for line in f:
                fields = line.strip().split('\t')
                if len(fields) < 8:
                    continue
                profiles[fields[0]] = fields[1:8]
    except IOError:
        return 'NT'

    cc_map = {}
    try:
        with open(cc_path) as f:
            header = f.readline().rstrip('\n').split('\t')
            cc_idx = None
            for i, col in enumerate(header):
                if 'clonal_complex' in col.lower() or col.lower() == 'cc':
                    cc_idx = i
                    break
            if cc_idx is not None:
                for line in f:
                    fields = line.rstrip('\n').split('\t')
                    if len(fields) > cc_idx:
                        cc = fields[cc_idx].strip()
                        if cc and cc not in ('', '-', 'NA'):
                            cc_map[fields[0]] = cc
    except IOError:
        return 'NT'

    best_st = None
    best_match = -1
    for st, prof in profiles.items():
        matches = sum(1 for a, b in zip(alleles, prof) if a == b)
        if matches > best_match:
            best_match = matches
            best_st = st

    if best_match >= 6 and best_st in cc_map:
        return cc_map[best_st]
    if best_match >= 6:
        return 'ST' + best_st
    return 'NT'


if __name__ == '__main__':
    if len(sys.argv) == 3:
        cc = lookup_cc_by_st(sys.argv[1], sys.argv[2])
        print(cc if cc else 'NT')
    elif len(sys.argv) == 11:
        # lookup_cc.py <cc_table> <st> <profiles> <a1> <a2> <a3> <a4> <a5> <a6> <a7>
        cc_path = sys.argv[1]
        st = sys.argv[2]
        profiles_path = sys.argv[3]
        alleles = sys.argv[4:11]
        cc = lookup_cc_by_st(cc_path, st)
        if cc:
            print(cc)
        else:
            print(lookup_cc_by_alleles(cc_path, profiles_path, alleles))
    else:
        print('NT')
