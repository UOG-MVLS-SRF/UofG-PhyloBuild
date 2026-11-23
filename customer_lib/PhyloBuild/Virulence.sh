#!/bin/bash

#Optional step: screens each genome against the VFDB virulence gene database and writes report tables (no plot). We use the same blastn approach as the carriage step.
#Usage: Virulence.sh <genomes_dir> <vfdb_fasta> <output_dir> [pct_identity] [pct_coverage]
set -u

genomes_dir="$1"
vfdb="$2"
out_dir="$3"
pident="${4:-80}"
qcov="${5:-80}"

script_dir="$(cd "$(dirname "$0")" && pwd)"
blast_dir="$(mktemp -d)"
mkdir -p "$out_dir"

echo "##### Virulence screening against VFDB (identity >= ${pident}%, coverage >= ${qcov}%) #####"
found_any="no"
for g in "$genomes_dir"/*.fasta; do
    [ -e "$g" ] || continue
    found_any="yes"
    name="$(basename "$g" .fasta)"
    echo "Screening $name for virulence genes..."
    blastn -query "$vfdb" -subject "$g" \
        -qcov_hsp_perc "$qcov" -perc_identity "$pident" -max_hsps 1 \
        -outfmt "6 qseqid pident length qcovhsp" > "$blast_dir/$name.tsv"
done

if [ "$found_any" = "no" ]; then
    echo "Virulence.sh: no .fasta genomes found in $genomes_dir - skipping."
    rm -rf "$blast_dir"
    exit 0
fi

python3 "$script_dir/py/virulence_report.py" "$vfdb" "$blast_dir" "$out_dir"
rm -rf "$blast_dir"
echo "Virulence reports written to $out_dir"
