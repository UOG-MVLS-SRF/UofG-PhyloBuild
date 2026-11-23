#!/usr/bin/env python3
"""Turn per-genome VFDB blastn hits into tidy virulence report tables.

Usage:
    virulence_report.py <vfdb_fasta> <blast_dir> <output_dir>

<blast_dir> holds one file per genome named "<genome>.tsv", each the output of
    blastn -query VFDB.fas -subject genome.fasta -max_hsps 1 \
           -outfmt "6 qseqid pident length qcovhsp"
(so columns are: VFDB_seqid, pct_identity, alignment_length, pct_query_coverage).

Writes, into <output_dir>:
    virulence_<genome>.tsv   - one report per genome (VF genes found in it)
    virulence_summary.tsv    - all genomes combined (long format)
    virulence_matrix.tsv     - presence/absence matrix (genomes x VF genes)
"""
import os
import re
import sys
import csv

# VFDB header example:
# >VFG037176(gb|WP_001081735) (plc1) phospholipase C [Phospholipase C (VF0470) - Exotoxin (VFC0235)] [Acinetobacter baumannii ACICU]
HEADER_RE = re.compile(
    r'^(?P<seqid>\S+)\s+\((?P<gene>[^)]*)\)\s+'
    r'(?P<product>.*?)\s*'
    r'(?:\[(?P<category>[^\]]*)\])?\s*'
    r'(?:\[(?P<organism>[^\]]*)\])?\s*$'
)


def parse_vfdb_headers(vfdb_fasta):
    """Map each VFDB sequence id -> (gene, product, category, organism)."""
    info = {}
    # VFDB headers contain non-UTF-8 bytes (e.g. 0xa0 in organism names) - be tolerant.
    with open(vfdb_fasta, encoding='utf-8', errors='replace') as fh:
        for line in fh:
            if not line.startswith('>'):
                continue
            header = line[1:].rstrip('\n')
            seqid = header.split()[0]
            m = HEADER_RE.match(header)
            if m:
                info[seqid] = (
                    m.group('gene') or '',
                    (m.group('product') or '').strip(),
                    m.group('category') or '',
                    m.group('organism') or '',
                )
            else:
                info[seqid] = ('', header, '', '')
    return info


def best_hits(blast_file):
    """Best (highest identity) hit per VFDB seqid in one genome's blast output."""
    best = {}
    with open(blast_file) as fh:
        for line in fh:
            parts = line.rstrip('\n').split('\t')
            if len(parts) < 4:
                continue
            seqid, pident, length, qcov = parts[0], parts[1], parts[2], parts[3]
            try:
                pident_f = float(pident)
            except ValueError:
                continue
            if seqid not in best or pident_f > best[seqid][0]:
                best[seqid] = (pident_f, length, qcov)
    return best


def main():
    if len(sys.argv) != 4:
        sys.exit("usage: virulence_report.py <vfdb_fasta> <blast_dir> <output_dir>")
    vfdb_fasta, blast_dir, out_dir = sys.argv[1:4]
    os.makedirs(out_dir, exist_ok=True)
    # per-genome reports go in a virulence/ subfolder; the combined summary and matrix
    # stay at the top level so they attach to the email
    per_dir = os.path.join(out_dir, 'virulence')
    os.makedirs(per_dir, exist_ok=True)

    info = parse_vfdb_headers(vfdb_fasta)

    genomes = sorted(
        f[:-4] for f in os.listdir(blast_dir) if f.endswith('.tsv')
    )

    summary_rows = []          # long format across all genomes
    matrix = {}                # gene -> set(genomes carrying it)
    all_genes = set()

    for genome in genomes:
        hits = best_hits(os.path.join(blast_dir, genome + '.tsv'))
        per_genome = os.path.join(per_dir, 'virulence_%s.tsv' % genome)
        with open(per_genome, 'w', newline='') as out:
            w = csv.writer(out, delimiter='\t')
            w.writerow(['VF_gene', 'product', 'VF_category',
                        'VFDB_id', 'pct_identity', 'pct_coverage'])
            # one row per VF gene name (keep the best hit for that gene)
            best_by_gene = {}
            for seqid, (pident, length, qcov) in hits.items():
                gene, product, category, organism = info.get(
                    seqid, ('', seqid, '', ''))
                gene_key = gene or seqid
                if gene_key not in best_by_gene or pident > best_by_gene[gene_key][4]:
                    best_by_gene[gene_key] = (
                        gene_key, product, category, seqid, pident, qcov)
            for gene_key in sorted(best_by_gene):
                gene, product, category, seqid, pident, qcov = best_by_gene[gene_key]
                w.writerow([gene, product, category, seqid,
                            '%.1f' % pident, qcov])
                summary_rows.append([genome, gene, product, category,
                                     '%.1f' % pident, qcov])
                matrix.setdefault(gene, set()).add(genome)
                all_genes.add(gene)

    # combined long-format summary
    with open(os.path.join(out_dir, 'virulence_summary.tsv'), 'w', newline='') as out:
        w = csv.writer(out, delimiter='\t')
        w.writerow(['genome', 'VF_gene', 'product', 'VF_category',
                    'pct_identity', 'pct_coverage'])
        w.writerows(summary_rows)

    # presence/absence matrix (genomes x VF genes)
    genes_sorted = sorted(all_genes)
    with open(os.path.join(out_dir, 'virulence_matrix.tsv'), 'w', newline='') as out:
        w = csv.writer(out, delimiter='\t')
        w.writerow(['genome'] + genes_sorted)
        for genome in genomes:
            w.writerow([genome] + [
                '1' if genome in matrix.get(g, ()) else '0' for g in genes_sorted])

    print("virulence_report: %d genomes, %d distinct VF genes" %
          (len(genomes), len(genes_sorted)))


if __name__ == '__main__':
    main()
