from ..models import PendingExecution
def detect_files(obj:PendingExecution)->dict:
    result = {
        "genome_tree":False,
        "gene_tree":False,
        "gene_interest":False,
        "carriage_gene":False,
        "reference_genes":False,
        "sample_text":False
    }
    for attr in result.keys():
        # Use getattr to get the value of the attribute from the obj
        if getattr(obj, attr, None):
            result[attr] = True
    return result
def decide_Group(tasks:list, detect:dict):
    #shall detact PhyloGene dir in the next phase?
    if detect["genome_tree"]:
        tasks.append("bash SpeciesType.sh")
        return True
    return False
def decide_Genes(tasks:list, detect:dict):
    # Run PhyloGenes to build the tree orthologues from an uploaded reference gene set, but
    # only if the user gave one and did not upload their own orthologues (gene_tree wins).
    if detect["reference_genes"] and detect["genome_tree"] and not detect["gene_tree"]:
        tasks.append("bash PhyloGenes.sh")
        return True
    return False
def decide_carriage(detect:dict):
    # carriage_gene present -> run carriage-gene BLAST + heatmap
    return detect["carriage_gene"]
def decide_genomes_oi(detect:dict):
    # gene_interest is the genomes-of-interest upload field
    return detect["gene_interest"]

#populates phylotree functions
def phylotree_commands(obj:PendingExecution):
    print("THIS IS A PHYLOTREE JOB")
    if obj.data_tree:
        commands="bash PhyloPlot.sh"
        return [commands]
    PhyloBuild= "bash PhyloBuild.sh"
    PhyloPlot = "bash PhyloPlot.sh"
    tasks=[]
    detection=detect_files(obj=obj)
    if decide_Group(tasks=tasks, detect=detection):
        PhyloBuild += " --phylogroup yes"
    #Taken out - we're not running Orthologue Discovery as part of the main pipeline 
    # if decide_Genes(tasks=tasks, detect=detection):
    #     PhyloBuild+= " --phylogenes yes"
    if decide_carriage(detect=detection):
        PhyloBuild+= " --genes_oi yes"
    if decide_genomes_oi(detect=detection):
        PhyloBuild+= " --genomes_oi yes"
    if getattr(obj, "run_virulence", False):
        PhyloBuild+= " --virulence yes"
    tasks.append(PhyloBuild)
    tasks.append(PhyloPlot)

    return tasks

#populates orthologue finding function
def orthologue_commands(obj:PendingExecution):
    print("THIS IS AN ORTHOLOGUE JOB")
    tasks = ["bash PhyloGenes.sh",]
    return tasks

def commands_generator(obj:PendingExecution)->list:
    job_type = obj.job_type

    if job_type == "orthologues":
        tasks = orthologue_commands(obj)
    else:
        tasks = phylotree_commands(obj)

    return tasks
