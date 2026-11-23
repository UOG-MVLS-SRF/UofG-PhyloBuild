#!/bin/bash

#### SpeciesType.sh — Auto-detect species and run appropriate typing ####
# Replaces PhyloGroup.sh.  Uses the mlst tool to detect the MLST scheme
# (and therefore species), then:
#   S. aureus  → MLST typing + clonal-complex lookup
#   E. coli    → ClermonTyping (phylogroups) + clade removal
#   Other      → MLST typing, labelled by ST

for arg in "$@"; do
  shift
  case "$arg" in
    "--genes_interest") set -- "$@" "-p" ;;
    "--genomes_interest") set -- "$@" "-h" ;;
    "--output")   set -- "$@" "-y" ;;
    "--tree_genes")   set -- "$@" "-l" ;;
    "--tree_genomes")   set -- "$@" "-o" ;;
    "--genomes_oi")   set -- "$@" "-t" ;;
    "--genes_oi")   set -- "$@" "-r" ;;
    *)        set -- "$@" "$arg"
  esac
done

while getopts "p:h:y:l:o:t:r:" opt
do
	case "$opt" in
		p) gene_dir="${OPTARG}" ;;
		h) genome_dir="${OPTARG}" ;;
		y) output_dir="${OPTARG}" ;;
		l) tree_genes="${OPTARG}" ;;
		o) tree_genomes="${OPTARG}" ;;
		t) genomes_oi="${OPTARG}" ;;
		r) genes_oi="${OPTARG}" ;;
	esac
done

shift $((OPTIND-1))

working_directory=`pwd`
genomeInterest=${genome_dir:-${working_directory}/Genomes_Interest}
geneInterest=${gene_dir:-${working_directory}/Carriage_Genes}
genesForTree=${tree_genes:-${working_directory}/Tree_Genes}
genomesForTree=${tree_genomes:-${working_directory}/Tree_Genomes}
plots=${output_dir:-${working_directory}/tmp_output}
genomes_oi=${genomes_oi:-"no"}
genes_oi=${genes_oi:-"no"}

python3 py/CheckFileFormat.py $genomesForTree $genesForTree $geneInterest $genomeInterest $genes_oi $genomes_oi

exit_status=$?
if [ $exit_status -ne 0 ]; then
    echo "An input file is not in FASTA format, please re-examine your input files"
    exit $exit_status
fi
echo "All is good, end of format check"

mkdir -p $plots
echo "Removing phylogeny_list.txt file - if it exists"
rm -f phylogeny_list.txt
echo "Removing gene match list from $plots - if it exists"
rm -f $plots/geneMatches.txt

if [ $genomes_oi == "yes" ]
then
	cd $genomeInterest
	echo "Converting .fa to .fasta"
	for filename in *.fa; do
		[ -e "$filename" ] || continue
		mv "${filename}" "${filename%#*.fa}.fasta"
		echo "Changed $filename to have .fasta extension"
	done
fi

cd $working_directory

if [ $genomes_oi == "yes" ]
then
	echo "Moving genomes added in to template genomes folder..."
	cp -a $genomeInterest/*.fasta $genomesForTree
	cd $genomeInterest
	echo "Making list of genomes added in..."
	ls *.fasta | sed 's/.fasta//g' > $plots/genomes.added.txt
fi

cd $genomesForTree
echo "Making list of genomes used to make the tree..."
ls *.fasta | sed 's/.fasta//g' > $plots/listGenomes.txt

cd $working_directory

######################################################################
# Auto-detect species from the first genome using mlst
######################################################################
first_genome=$(head -1 $plots/listGenomes.txt)
echo "===== Auto-detecting species from: $first_genome ====="
detected_scheme=$(conda run -n ohrbid mlst --quiet "$genomesForTree/${first_genome}.fasta" 2>/dev/null | awk '{print $2}')
echo "Detected MLST scheme: $detected_scheme"

###################################
# S. aureus → MLST + clonal complex
###################################
if [[ "$detected_scheme" == saureus* ]]; then
    echo "====== Staphylococcus aureus detected — running MLST ======"

    # Pre-computed CC lookup table and raw allele profiles
    profile_path="/opt/mlst/saureus_cc.tsv"
    allele_profiles="/app/mlst_lookups/saureus_cc.tsv"

    for x in `cat $plots/listGenomes.txt`
    do
        mlst_line=$(conda run -n ohrbid mlst --quiet --scheme saureus "$genomesForTree/$x.fasta" 2>/dev/null)
        st=$(echo "$mlst_line" | awk '{print $3}')
        # Extract the 7 allele numbers (columns 4-10), stripping any parenthetical novel markers
        a1=$(echo "$mlst_line" | awk '{print $4}'  | sed 's/[^0-9]//g')
        a2=$(echo "$mlst_line" | awk '{print $5}'  | sed 's/[^0-9]//g')
        a3=$(echo "$mlst_line" | awk '{print $6}'  | sed 's/[^0-9]//g')
        a4=$(echo "$mlst_line" | awk '{print $7}'  | sed 's/[^0-9]//g')
        a5=$(echo "$mlst_line" | awk '{print $8}'  | sed 's/[^0-9]//g')
        a6=$(echo "$mlst_line" | awk '{print $9}'  | sed 's/[^0-9]//g')
        a7=$(echo "$mlst_line" | awk '{print $10}' | sed 's/[^0-9]//g')
        cc=$(python3 py/lookup_cc.py "$profile_path" "$st" "$allele_profiles" $a1 $a2 $a3 $a4 $a5 $a6 $a7)
        echo "  $x -> ST${st} alleles=[$a1,$a2,$a3,$a4,$a5,$a6,$a7] -> ${cc}"
        echo -e "${cc}\t$x" >> $working_directory/phylogeny_list.txt
    done

    # No clade removal for S. aureus — write output directly
    > $working_directory/new_phylogeny_list.txt
    > $working_directory/new_genome_list.txt
    while IFS=$'\t' read -r cc genome; do
        echo -e "${genome}\t${cc}" >> $working_directory/new_phylogeny_list.txt
        echo "$genome" >> $working_directory/new_genome_list.txt
    done < $working_directory/phylogeny_list.txt

#######################################
# E. coli → ClermonTyping (phylogroups)
#######################################
elif [[ "$detected_scheme" == ecoli* ]]; then
    echo "====== Escherichia coli detected — running ClermonTyping ======"

    cd ClermonTyping/

    for x in `cat $plots/listGenomes.txt`
    do
        makeblastdb -in $genomesForTree/$x.fasta -input_type fasta -out my_fasta -dbtype nucl
        blastn -query ./data/primers.fasta -perc_identity 90 -task blastn -outfmt 5 -db my_fasta -out my_fasta.xml
        python bin/clermont.py -x my_fasta.xml -s 2000 > temp.txt

        phylogroup=`head temp.txt | awk '{print $(NF)}'`

        case "$phylogroup" in
            albertii)   phylogroup="ALB" ;;
            fergusonii) phylogroup="FER" ;;
            cladeI)     phylogroup="I" ;;
            cladeII)    phylogroup="II" ;;
            cladeIII)   phylogroup="III" ;;
            cladeIV)    phylogroup="IV" ;;
            cladeV)     phylogroup="V" ;;
        esac

        echo -e "${phylogroup}\t$x" >> $working_directory/phylogeny_list.txt
    done

    cd $working_directory

    echo "Removing strains assigned clade phylogroup"
    python3 py/removeCladesFromList.py $working_directory

######################################
# Other species → MLST (ST labels only)
######################################
else
    echo "====== Species not specifically supported (scheme: $detected_scheme) — running MLST ======"

    for x in `cat $plots/listGenomes.txt`
    do
        st=$(conda run -n ohrbid mlst --quiet "$genomesForTree/$x.fasta" 2>/dev/null | awk '{print $3}')
        if [ "$st" == "-" ] || [ -z "$st" ]; then
            st="NT"
        else
            st="ST${st}"
        fi
        echo "  $x -> ${st}"
        echo -e "${st}\t$x" >> $working_directory/phylogeny_list.txt
    done

    > $working_directory/new_phylogeny_list.txt
    > $working_directory/new_genome_list.txt
    while IFS=$'\t' read -r st genome; do
        echo -e "${genome}\t${st}" >> $working_directory/new_phylogeny_list.txt
        echo "$genome" >> $working_directory/new_genome_list.txt
    done < $working_directory/phylogeny_list.txt
fi

cd $working_directory

# Copy results to the same locations PhyloGroup.sh used
cp $working_directory/new_genome_list.txt $plots/listGenomes.txt
cp $working_directory/new_phylogeny_list.txt $plots/group_list.txt
cp $plots/group_list.txt $working_directory/group_list.txt

if [ $genomes_oi == "yes" ]
then
	echo "Removing genomes of interest from general genome file"
	cd $genomesForTree
	for f in `cat $plots/genomes.added.txt`
	do
    		rm ${f}.fasta
	done
fi

cd $working_directory

mv $plots/listGenomes.txt $working_directory/listGenomes.txt
rm -r $plots

rm -f phylogeny_list.txt
rm -f new_genome_list.txt
rm -f new_phylogeny_list.txt
