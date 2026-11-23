#!/usr/bin/env python3
"""Combine per-genome AMRFinderPlus output into tidy report tables.

Usage: amr_report.py <raw_dir> <output_dir>

<raw_dir> holds one raw AMRFinderPlus TSV per genome named "<genome>.tsv".
Writes, into <output_dir>:
    amr_<genome>.tsv   - one report per genome (key columns only)
    amr_summary.tsv    - all genomes combined (long format, with a genome column)
    amr_matrix.tsv     - presence/absence matrix (genomes x AMR gene symbols)
"""
import os
import sys
import csv

# Key AMRFinderPlus v4 columns to keep in the tidy reports.
KEEP = ['Element symbol', 'Element name', 'Type', 'Subtype', 'Class', 'Subclass',
        'Method', '% Coverage of reference', '% Identity to reference']


def read_rows(path):
    with open(path, encoding='utf-8', errors='replace') as fh:
        return list(csv.DictReader(fh, delimiter='\t'))


def main():
    if len(sys.argv) != 3:
        sys.exit("usage: amr_report.py <raw_dir> <output_dir>")
    raw_dir, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)
    # per-genome reports go in an amr/ subfolder; the combined summary and matrix stay
    # at the top level so they attach to the email
    per_dir = os.path.join(out_dir, 'amr')
    os.makedirs(per_dir, exist_ok=True)

    genomes = sorted(f[:-4] for f in os.listdir(raw_dir) if f.endswith('.tsv'))

    summary_rows = []
    matrix = {}          # gene symbol -> set(genomes)
    all_genes = set()

    for genome in genomes:
        rows = read_rows(os.path.join(raw_dir, genome + '.tsv'))
        per = os.path.join(per_dir, 'amr_%s.tsv' % genome)
        with open(per, 'w', newline='') as out:
            w = csv.writer(out, delimiter='\t')
            w.writerow(KEEP)
            for r in rows:
                vals = [r.get(k, '') for k in KEEP]
                w.writerow(vals)
                summary_rows.append([genome] + vals)
                gene = r.get('Element symbol', '')
                if gene:
                    matrix.setdefault(gene, set()).add(genome)
                    all_genes.add(gene)

    with open(os.path.join(out_dir, 'amr_summary.tsv'), 'w', newline='') as out:
        w = csv.writer(out, delimiter='\t')
        w.writerow(['genome'] + KEEP)
        w.writerows(summary_rows)

    genes_sorted = sorted(all_genes)
    with open(os.path.join(out_dir, 'amr_matrix.tsv'), 'w', newline='') as out:
        w = csv.writer(out, delimiter='\t')
        w.writerow(['genome'] + genes_sorted)
        for genome in genomes:
            w.writerow([genome] + [
                '1' if genome in matrix.get(g, ()) else '0' for g in genes_sorted])

    print("amr_report: %d genomes, %d distinct AMR genes" %
          (len(genomes), len(genes_sorted)))


if __name__ == '__main__':
    main()
