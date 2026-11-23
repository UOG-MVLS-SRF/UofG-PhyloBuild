#!/bin/bash

#Optional step: runs NCBI AMRFinderPlus on each genome to find AMR genes and write report tables. This is separate from the tree - it doesn't affect it.
#Usage: AMR.sh <genomes_dir> <output_dir> [amrfinder_bin] [threads]
#Keep threads low (default 1) - AMRFinderPlus runs tblastn in parallel and will run out of memory on a small VM if we let it use all CPUs.
set -u

genomes_dir="$1"
out_dir="$2"
amrfinder="${3:-/opt/amrfinder/amrfinder}"
threads="${4:-1}"

script_dir="$(cd "$(dirname "$0")" && pwd)"
raw_dir="$(mktemp -d)"
mkdir -p "$out_dir"
#amrfinder needs its own folder plus BLAST/HMMER on the PATH to work.
export PATH=/opt/amrfinder:/usr/local/bin:$PATH

echo "##### AMR screening with AMRFinderPlus (threads=${threads}) #####"
found_any="no"
for g in "$genomes_dir"/*.fasta; do
    [ -e "$g" ] || continue
    found_any="yes"
    name="$(basename "$g" .fasta)"
    echo "Screening $name for AMR genes..."
    "$amrfinder" -n "$g" --threads "$threads" > "$raw_dir/$name.tsv" 2>"$raw_dir/$name.err" \
        || echo "AMR.sh: amrfinder failed on $name (skipping) - see log"
done

if [ "$found_any" = "no" ]; then
    echo "AMR.sh: no .fasta genomes found in $genomes_dir - skipping."
    rm -rf "$raw_dir"
    exit 0
fi

python3 "$script_dir/py/amr_report.py" "$raw_dir" "$out_dir"
rm -rf "$raw_dir"
echo "AMR reports written to $out_dir"
