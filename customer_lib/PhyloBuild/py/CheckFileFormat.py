#!/usr/bin/env python
# coding: utf-8

# In[22]:


#Making sure that the file input's are in the correct format

from Bio import SeqIO
import os
import re
import sys
import argparse

def none_or_string(value):
	return None if value in (None, "None", "") else value

#This allows user inputted genome and gene directories.
parser = argparse.ArgumentParser()

parser.add_argument("TreeGenomePath")
parser.add_argument("TreeGenePath")
parser.add_argument("CarriageGenePath")
parser.add_argument("GenomeInterestPath")
parser.add_argument("genes_oi", nargs="?", type=none_or_string, default=None)
parser.add_argument("genomes_oi", nargs="?", type=none_or_string, default=None)

args = parser.parse_args()

TreeGenomePath = args.TreeGenomePath
TreeGenePath = args.TreeGenePath
CarriageGenePath = args.CarriageGenePath
GenomeInterestPath = args.GenomeInterestPath
genes_oi = args.genes_oi
genomes_oi = args.genomes_oi

#Function for determining whether a file is FASTA format or not
def is_fasta(filename):
    with open(filename,"r") as handle:
        fasta = SeqIO.parse(handle, "fasta")
        return any(fasta) # False when fasta is empty - i.e. wasn't a fasta file

#Checks each directory containing user input - Genomes, genes, template genomes, and template genes.

for file in os.listdir(TreeGenomePath):
    if (file != "Tree_Genomes"):
        filepath = TreeGenomePath + "/" + file 
        #print(filepath)
        if (is_fasta(filepath) == False):
            #If a file is determined to not be in FASTA format, then the script does a sys.exit().
            sys.exit("Genomes of interest not in FASTA format: see " + filepath)
print("Input: Genomes of interest are in FASTA format")

for file in os.listdir(TreeGenePath):
    if (file != "Template_Genes"):
        filepath = TreeGenePath + "/" + file 
        if (is_fasta(filepath) == False):
            sys.exit("Genes of interest not in FASTA format: see: " + filepath)
print("Input: Genes of interest are in FASTA format")

if [genomes_oi == "yes"]:
    for file in os.listdir(GenomeInterestPath):
        if (file != "Template_Genomes"):
            filepath = GenomeInterestPath + "/" + file 
            #print(filepath)
            if (is_fasta(filepath) == False):
                sys.exit("Template Genomes are not in FASTA format: see " + file)
    print("Input: Template Genomes are in FASTA format")

if [genes_oi == "yes"]:
    for file in os.listdir(CarriageGenePath):
        if (file != "Template_Genes"):
            filepath = CarriageGenePath +"/" + file 
            #print(filepath)
            if (is_fasta(filepath) == False):
                sys.exit("Template Genes are not in FASTA format: see " + file)
    print("Input: Template Genes are in FASTA format")

# In[ ]:
