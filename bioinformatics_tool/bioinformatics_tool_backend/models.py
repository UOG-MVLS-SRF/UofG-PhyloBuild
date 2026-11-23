from django.conf import settings
from django.db import models
from django.contrib.auth.models import User
import os
import shutil
from .model_support_funcs import *


class PhyloUser(User):
    class Meta:
        proxy = True

    def display_name(self):
        return f'{self.first_name} {self.last_name}'
    
    def __str__(self) -> str:
        return super().__str__()
    
class Execution(models.Model):
    session_id=models.BigIntegerField()
    email=models.EmailField(null=True, default=None)
    genome_tree=models.FileField(upload_to=create_genome_tree_upload_path, null=True)
    gene_tree=models.FileField(upload_to=create_gene_tree_upload_path, null=True)
    gene_interest=models.FileField(upload_to=create_gene_interest_upload_path, null=True)
    carriage_gene=models.FileField(upload_to=create_carriage_gene_upload_path, null=True)
    # Optional: reference strain gene set -> PhyloGenes derives the tree orthologues from it
    reference_genes=models.FileField(upload_to=create_reference_genes_upload_path, null=True)
    # Optional opt-in: screen genomes for VFDB virulence genes (report tables only)
    run_virulence=models.BooleanField(default=False)
    # Optional: carry out plasmid reconstruction
    run_plasmids=models.BooleanField(default=False)
    #Allows choosing different types of job (PhyloTree, Orthologue Finder)
    job_type= models.CharField(null=True,blank=True,default=None)
    
    class Meta:
        abstract = True  # Make Execution an abstract base class

    def delete(self, *args, **kwargs):
        shutil.rmtree(os.path.join(settings.MEDIA_ROOT,self.file_path,str(self.session_id)))
        super().delete(*args, **kwargs)

#Class for storing Genomes
class StoredGenome(models.Model):
    name = models.CharField(max_length=255)
    accession = models.CharField(max_length=100, unique=True)
    file_path = models.CharField(max_length=500)
    tag=models.CharField(max_length=50, null=True)
    
class PendingExecution(Execution):
    class StatusInLine(models.TextChoices):
        FORM="FO", ("FORMING")
        PEND="PE", ("Pending")
        RUN="RU", ("RUNNING")
        ERR="ER", ("Error")
    status=models.CharField(
        max_length=2,
        choices=StatusInLine.choices,
        default=StatusInLine.FORM,
    )
    file_path = models.CharField(default="input")
    sample_text = models.TextField(null=True, blank=True)
    data_tree = models.FileField(upload_to=create_data_tree_upload_path, null=True)
    database_genomes = models.ManyToManyField(
        StoredGenome,
        blank=True
    )
    display_names = models.JSONField(
        default=dict,
        blank=True
    )
    
    def get_status(self):
        return self.StatusInLine[self.status]


class FinishedExecution(Execution):
    file_path = models.CharField(default="output")
    output_dir = models.FilePathField(path=file_path)