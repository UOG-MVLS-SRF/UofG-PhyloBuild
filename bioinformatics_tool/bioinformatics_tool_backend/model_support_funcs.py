import os


def create_path(instance,field_name,filename):
    return os.path.join(
        instance.file_path,
        str(instance.session_id),
        field_name,filename
    )

def create_genome_tree_upload_path(instance, filename):
    return create_path(instance, 'genome_tree', filename)

def create_gene_tree_upload_path(instance, filename):
    return create_path(instance, 'gene_tree', filename)

def create_gene_interest_upload_path(instance, filename):
    return create_path(instance, 'gene_interest', filename)

def create_carriage_gene_upload_path(instance, filename):
    return create_path(instance, 'carriage_gene', filename)

def create_data_tree_upload_path(instance, filename):
    return create_path(instance, 'data_tree', filename)

def create_reference_genes_upload_path(instance, filename):
    # Reference strain gene set for PhyloGenes (auto orthologue detection)
    return create_path(instance, 'reference_genes', filename)

def create_ohrbid_reference_upload_path(instance, filename):
    return create_path(instance, 'ohrbid_ref_genome', filename)

def create_ohrbid_outgroup_upload_path(instance, filename):
    return create_path(instance, 'ohrbid_outgroup_genome', filename)