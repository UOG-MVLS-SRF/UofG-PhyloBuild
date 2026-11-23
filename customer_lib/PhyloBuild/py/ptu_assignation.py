import sys
import pathlib
import pandas as pd

def run_ptu_assignation(results_dir, output_dir):
    plasmid_typing_results = results_dir
    tsv_files = list(pathlib.Path(plasmid_typing_results).rglob('*ptu_prediction.tsv'))
    if not tsv_files:
        print("Error: No matching TSV files found in the plasmid typing results directory.")
        sys.exit(1)

    rows = []
    header = None

    for i, tsv_file in enumerate(tsv_files):
        sample_id = tsv_file.parent.parent.name
        filename = tsv_file.name
        first_underscore = filename.find('_')
        plasmid_id = filename[first_underscore + 1:first_underscore + 6]

        with open(tsv_file) as f:
            lines = [line.rstrip('\n') for line in f]
        if len(lines) < 2:
            continue 

        if i == 0:
            header = ['sample_id', 'plasmid_id'] + lines[0].split('\t')
            rows.append(header)

        info_row = [sample_id, plasmid_id] + lines[1].split('\t')
        rows.append(info_row)

    output_file = f'{output_dir}/PTU_summary.txt'

    with open(output_file, 'w') as out:
        for row in rows:
            out.write('\t'.join(row) + '\n')

    print(f"PTU summary written to {output_file}")

def main():

	if len(sys.argv) != 3:
		print(f"Usage: {sys.argv[0]} <results_dir> <output_dir>")
		sys.exit(1)

	results_dir = sys.argv[1]
	output_dir = sys.argv[2]

	run_ptu_assignation(results_dir, output_dir)

if __name__ == "__main__":
	main()